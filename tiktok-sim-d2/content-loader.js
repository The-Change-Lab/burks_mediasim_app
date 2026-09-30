// =====================================================================
//  CONTENT LOADER: reads content.xlsx (Videos / Profiles / Messages tabs)
//  and turns it into the data the app uses. You don't need to edit this;
//  edit content.xlsx instead.
// =====================================================================
window.ContentLoader = (function () {
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
        avatar: str(r.avatar) || null,
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
        src: file.includes("/") ? file : "videos/" + file,
        profile: creator,
        inFeed: str(r.show_in_feed) === "" ? true : yes(r.show_in_feed),
        caption: str(r.caption),
        sound: str(r.sound),
        likes: num(r.likes), comments: num(r.comments), bookmarks: num(r.bookmarks), shares: num(r.shares),
        views: val(r.views),
        thumb: str(r.thumbnail) || null,
      });
    });
    if (!videos.some((v) => v.inFeed)) errors.push("No videos are marked show_in_feed = yes, so the Home feed would be empty.");

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

  async function fromUrl(url) {
    const bust = (url.includes("?") ? "&" : "?") + "v=" + Date.now(); // always get the newest version
    const res = await fetch(url + bust, { cache: "no-store" });
    if (!res.ok) throw new Error(`Couldn't load ${url} (error ${res.status}). Is the file uploaded with exactly that name?`);
    return parse(XLSX.read(await res.arrayBuffer(), { type: "array" }));
  }
  async function fromFile(file) {
    return parse(XLSX.read(await file.arrayBuffer(), { type: "array" }));
  }
  return { fromUrl, fromFile, parse };
})();
