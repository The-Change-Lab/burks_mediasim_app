// =====================================================================
//  CONTENT LOADER: reads content.xlsx (Videos / Profiles / Messages tabs)
//  and turns it into the data the app uses. You don't need to edit this;
//  edit content.xlsx and config.js instead.
//
//  Videos can live in three places:
//    1. The "videos" folder on GitHub        (file column: myclip.mp4)
//    2. A shared Google Drive folder          (file column: myclip.mp4,
//       with googleDrive.videoFolder set in config.js)
//    3. Any link                              (file column: a Google Drive
//       share link, or any https:// link)
// =====================================================================
window.ContentLoader = (function () {
  const C = window.APP_CONFIG || {};
  const G = C.googleDrive || {};
  const API = "https://www.googleapis.com/drive/v3/files";
  const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  const str = (v) => (v == null ? "" : String(v).trim());
  const yes = (v) => /^(y|yes|true|1|x|✓)$/i.test(str(v));
  // Keep real numbers as numbers (so likes can go up by 1); keep "1.2M" as text.
  const num = (v) => {
    if (typeof v === "number") return v;
    const s = str(v).replace(/,/g, "");
    if (!s) return 0;
    return /^\d+(\.\d+)?$/.test(s) ? Number(s) : s;
  };
  const val = (v) => (typeof v === "number" ? v : str(v));

  // ------------------------------------------------------------ spreadsheet
  function rows(wb, name) {
    const sn = wb.SheetNames.find((n) => n.trim().toLowerCase() === name.toLowerCase());
    if (!sn) return null;
    return XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: null, raw: true }).map((r) => {
      const o = {};
      for (const k in r) o[k.trim().toLowerCase().replace(/\s+/g, "_")] = r[k];
      return o;
    });
  }
  const isBlank = (r) => !Object.values(r).some((v) => str(v) !== "");

  function parse(wb) {
    const errors = [], warnings = [];
    const P = rows(wb, "Profiles"), V = rows(wb, "Videos"), M = rows(wb, "Messages") || [];
    if (!V) errors.push('The spreadsheet has no "Videos" tab.');
    if (!P) errors.push('The spreadsheet has no "Profiles" tab.');
    if (errors.length) return { errors, warnings };

    // ---- Profiles
    const profiles = {};
    let self = null;
    P.forEach((r, i) => {
      const row = i + 2, id = str(r.creator_id);
      if (isBlank(r)) return;
      if (!id) { warnings.push(`Profiles row ${row}: missing creator_id, so it was skipped.`); return; }
      if (profiles[id]) warnings.push(`Profiles row ${row}: creator_id "${id}" is used more than once.`);
      profiles[id] = {
        handle: str(r.handle).replace(/^@/, "") || id,
        name: str(r.display_name) || str(r.handle) || id,
        bio: str(r.bio),
        following: val(r.following) || 0,
        followers: val(r.followers) || 0,
        likes: val(r.likes) || 0,
        verified: yes(r.verified),
        avatar: str(r.avatar) || null, // resolved to a real address in finalize()
        color: str(r.color) || "#888888",
      };
      if (yes(r.is_you)) {
        if (self) warnings.push(`More than one profile has is_you = yes; using "${self}".`);
        else self = id;
      }
    });
    const ids = Object.keys(profiles);
    if (!ids.length) { errors.push("The Profiles tab has no profiles."); return { errors, warnings }; }
    if (!self) { self = ids[0]; warnings.push(`No profile has is_you = yes, so "${self}" is used for the Profile tab.`); }

    // ---- Videos (row order = feed order)
    const seen = new Set(), videos = [];
    V.forEach((r, i) => {
      const row = i + 2, id = str(r.video_id), file = str(r.file);
      if (isBlank(r)) return;
      if (!id) { warnings.push(`Videos row ${row}: missing video_id, so it was skipped.`); return; }
      if (seen.has(id)) { warnings.push(`Videos row ${row}: video_id "${id}" is used more than once, so it was skipped.`); return; }
      if (!file) { warnings.push(`Videos row ${row} (${id}): no file name, so it was skipped.`); return; }
      seen.add(id);
      const creator = str(r.creator);
      if (!profiles[creator]) warnings.push(`Videos row ${row} (${id}): creator "${creator}" isn't on the Profiles tab.`);
      videos.push({
        id,
        row,
        file,      // what was typed in the spreadsheet
        src: null, // resolved to a real address in finalize()
        profile: creator,
        inFeed: str(r.show_in_feed) === "" ? true : yes(r.show_in_feed),
        caption: str(r.caption),
        sound: str(r.sound),
        likes: num(r.likes), comments: num(r.comments), bookmarks: num(r.bookmarks), shares: num(r.shares),
        views: val(r.views),
        thumb: str(r.thumbnail) || null,
      });
    });

    // ---- Messages (rows with the same conversation_id form one chat)
    const conversations = [], byId = {};
    M.forEach((r, i) => {
      const row = i + 2, cid = str(r.conversation_id), text = str(r.text);
      if (isBlank(r)) return;
      if (!cid) { warnings.push(`Messages row ${row}: missing conversation_id, so it was skipped.`); return; }
      let c = byId[cid];
      if (!c) {
        const creator = str(r.creator);
        if (!profiles[creator]) warnings.push(`Messages row ${row}: creator "${creator}" isn't on the Profiles tab.`);
        c = byId[cid] = { id: cid, profile: creator, time: str(r.time), unread: yes(r.unread), messages: [] };
        conversations.push(c);
      }
      if (text) c.messages.push({ from: /^me$/i.test(str(r.from)) ? "me" : "them", text });
    });

    return { errors, warnings, content: { selfProfile: self, profiles, videos, conversations } };
  }

  // ------------------------------------------------------------ Google Drive
  const isDriveUrl = (s) => /^https?:\/\/(drive|docs|drive\.usercontent)\.google\.com\//i.test(s);
  // Pull the file/folder ID out of any kind of Google Drive link (or accept a bare ID).
  function driveId(s, kind) {
    s = str(s);
    const m = kind === "folder"
      ? s.match(/\/folders\/([\w-]{10,})/) || s.match(/[?&]id=([\w-]{10,})/)
      : s.match(/\/(?:file|document|spreadsheets|presentation)\/(?:u\/\d+\/)?d\/([\w-]{10,})/) || s.match(/[?&]id=([\w-]{10,})/);
    if (m) return m[1];
    return /^[\w-]{25,}$/.test(s) ? s : null;
  }
  const keyParam = () => "key=" + encodeURIComponent(G.apiKey);
  // Address the video player loads a Drive file from.
  function mediaUrl(id) {
    if (G.apiKey) return `${API}/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true&${keyParam()}`;
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`; // less reliable fallback
  }
  async function driveError(res) {
    let msg = "";
    try { const j = await res.json(); msg = ((j.error && j.error.message) || "").trim().replace(/\.$/, ""); } catch (e) {}
    const hint =
      res.status === 404 ? " Make sure it's shared as \"Anyone with the link\" (Viewer)." :
      res.status === 403 ? " Check the API key: the Google Drive API must be enabled for it, and if you restricted it to websites, this site's address must be on the list." :
      res.status === 400 ? " Check that the API key in config.js was copied correctly." : "";
    return `Google Drive error ${res.status}${msg ? ": " + msg : ""}.${hint}`;
  }
  async function driveJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(await driveError(res));
    return res.json();
  }
  async function listFolder(folderId) {
    const files = [];
    let token = "";
    do {
      const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const url = `${API}?q=${q}&fields=nextPageToken,files(id,name,mimeType)&pageSize=1000` +
        `&supportsAllDrives=true&includeItemsFromAllDrives=true&${keyParam()}` +
        (token ? "&pageToken=" + encodeURIComponent(token) : "");
      const j = await driveJson(url);
      files.push(...(j.files || []));
      token = j.nextPageToken || "";
    } while (token);
    return files.filter((f) => f.mimeType !== "application/vnd.google-apps.folder");
  }

  // Turn every file name / link from the spreadsheet into a real address.
  async function finalize(res) {
    if (res.errors.length) return res;
    const c = res.content, warn = (m) => res.warnings.push(m), fail = (m) => { res.errors.push(m); return res; };

    let byName = null, byStem = null;
    if (G.videoFolder) {
      const folderId = driveId(G.videoFolder, "folder");
      if (!folderId) return fail("config.js: googleDrive.videoFolder doesn't look like a Google Drive folder link.");
      if (!G.apiKey) return fail("config.js: a Google Drive folder is set, but googleDrive.apiKey is empty. The app needs an API key to see what's in the folder.");
      let files;
      try { files = await listFolder(folderId); }
      catch (e) { return fail("Couldn't open the Google Drive video folder. " + e.message); }
      if (!files.length) warn("The Google Drive video folder looks empty (or its files aren't shared).");
      byName = new Map(); byStem = new Map();
      files.forEach((f) => {
        const k = f.name.trim().toLowerCase();
        if (byName.has(k)) warn(`The Google Drive folder has two files named "${f.name}"; using the first one.`);
        else byName.set(k, f);
        const stem = k.replace(/\.[^.]+$/, "");
        if (!byStem.has(stem)) byStem.set(stem, f);
      });
      res.driveFolderFiles = files.length;
    }

    let driveWithoutKey = false;
    const resolve = (raw, where, localDir) => {
      raw = str(raw);
      if (!raw) return null;
      if (isDriveUrl(raw)) {
        const id = driveId(raw, "file");
        if (!id) { warn(`${where}: couldn't read the Google Drive link "${raw}".`); return null; }
        if (!G.apiKey) driveWithoutKey = true;
        return { url: mediaUrl(id) };
      }
      if (/^https?:\/\//i.test(raw) || raw.includes("/")) return { url: raw };
      if (byName) {
        const k = raw.toLowerCase();
        const f = byName.get(k) || byStem.get(k) || byStem.get(k.replace(/\.[^.]+$/, ""));
        if (f) return { url: mediaUrl(f.id), mime: f.mimeType, name: f.name };
        if (localDir) warn(`${where}: "${raw}" isn't in the Google Drive folder, so the app will look for it in the "${localDir}" folder on GitHub instead.`);
        else warn(`${where}: "${raw}" isn't in the Google Drive folder.`);
      }
      return { url: localDir ? localDir + "/" + raw : raw };
    };

    c.videos = c.videos.filter((v) => {
      const where = `Videos row ${v.row} (${v.id})`;
      const r = resolve(v.file, where, "videos");
      if (!r) { warn(`${where} was skipped.`); return false; }
      if ((r.mime && /quicktime/.test(r.mime)) || /\.mov$/i.test(r.name || v.file)) {
        warn(`${where}: "${r.name || v.file}" is a .mov file. Chrome and Firefox may not play it; convert it to .mp4.`);
      }
      v.src = r.url;
      const t = resolve(v.thumb, where + " thumbnail", "");
      v.thumb = t ? t.url : null;
      return true;
    });
    Object.keys(c.profiles).forEach((id) => {
      const p = c.profiles[id];
      const a = resolve(p.avatar, `Profile "${id}" avatar`, "");
      p.avatar = a ? a.url : null;
    });

    if (driveWithoutKey) warn("Google Drive links are being used without an API key. Videos may fail to load for some participants; adding googleDrive.apiKey in config.js is much more reliable.");
    if (!c.videos.some((v) => v.inFeed)) res.errors.push("No videos are marked show_in_feed = yes, so the Home feed would be empty.");
    return res;
  }

  // ------------------------------------------------------------ loading
  const readWorkbook = (buf) => XLSX.read(buf, { type: "array" });

  async function fromDrive(link) {
    const id = driveId(link, "file");
    if (!id) throw new Error("contentFile in config.js doesn't look like a Google Sheets or Google Drive file link.");
    if (!G.apiKey) throw new Error("To load the spreadsheet from Google Drive, add googleDrive.apiKey in config.js.");
    const meta = await driveJson(`${API}/${encodeURIComponent(id)}?fields=mimeType,name&supportsAllDrives=true&${keyParam()}`);
    const url = meta.mimeType === "application/vnd.google-apps.spreadsheet"
      ? `${API}/${encodeURIComponent(id)}/export?mimeType=${encodeURIComponent(XLSX_MIME)}&${keyParam()}`
      : `${API}/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true&${keyParam()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Couldn't load the spreadsheet from Google Drive. " + (await driveError(res)));
    return finalize(parse(readWorkbook(await res.arrayBuffer())));
  }

  async function fromUrl(url) {
    if (isDriveUrl(url)) return fromDrive(url);
    const bust = (url.includes("?") ? "&" : "?") + "v=" + Date.now(); // always get the newest version
    const res = await fetch(url + bust, { cache: "no-store" });
    if (!res.ok) throw new Error(`Couldn't load ${url} (error ${res.status}). Is the file uploaded with exactly that name?`);
    return finalize(parse(readWorkbook(await res.arrayBuffer())));
  }
  async function fromFile(file) {
    return finalize(parse(readWorkbook(await file.arrayBuffer())));
  }
  return { fromUrl, fromFile, parse, finalize, driveId, mediaUrl };
})();
