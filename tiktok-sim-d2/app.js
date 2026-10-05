// =====================================================================
//  APP: feed, profiles, inbox, navigation and interaction tracking.
//  You shouldn't need to edit this file to change content or settings;
//  use config.js and content.xlsx instead.
// =====================================================================
(function () {
  "use strict";
  const C = window.APP_CONFIG;
  let D = null;            // filled in from content.xlsx (see boot() at the bottom)
  let contentSource = null;
  const L = window.Logger;
  const $ = (s, r) => (r || document).querySelector(s);
  const now = () => performance.now();

  // ---------------------------------------------------------------- icons
  const ICON = {
    home: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.1C1.1 8.6 3.2 5 6.8 5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.6 0 5.7 3.6 4.3 6.9C19.5 16.4 12 21 12 21z"/></svg>',
    comment: '<svg viewBox="0 0 24 24"><path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.5 1.3 4.8 3.4 6.3L5 22l4.2-2.3c.9.2 1.8.3 2.8.3 5.5 0 10-3.8 10-8.5S17.5 3 12 3z"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M14 4l8 7.5-8 7.5v-4.5c-5 0-8.5 1.5-11 5 1-5 4-10 11-11z"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .7 3.5 2.8 3.5 6"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21h4"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  };

  // -------------------------------------------------------------- helpers
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function fmt(n) {
    if (typeof n === "string") return n;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }
  // Numeric counts go up by 1 when toggled on; text like "1.2M" is shown as-is.
  function count(base, on) { return typeof base === "number" ? fmt(base + (on ? 1 : 0)) : fmt(base || 0); }
  function h(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function profileOf(id) { return D.profiles[id] || { handle: id, name: id, color: "#888" }; }
  function avatarHTML(p, size) {
    const st = `width:${size}px;height:${size}px;`;
    if (p.avatar) return `<img class="avatar" src="${esc(p.avatar)}" alt="" style="${st}">`;
    const ini = (p.name || p.handle || "?").trim().slice(0, 1).toUpperCase();
    return `<span class="avatar" style="${st}background:${esc(p.color || "#888")};font-size:${Math.round(size * 0.42)}px">${esc(ini)}</span>`;
  }
  const verifiedHTML = (p) => (p.verified ? '<span class="verified">✓</span>' : "");
  function captionHTML(s) { return esc(s).replace(/(#[\w]+)/g, "<b>$1</b>"); }
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1600);
  }
  function hashStr(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function seededShuffle(arr, seed) {
    const a = arr.slice(); let s = seed || 1;
    const rnd = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296;
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  document.querySelectorAll("[data-icon]").forEach((e) => (e.innerHTML = ICON[e.dataset.icon]));

  // ---------------------------------------------------------------- state
  const S = {
    tab: "home",
    tabEnteredAt: 0,
    overlays: [],       // stack of {type, root, feed?, openedAt, meta}
    homeFeed: null,
    activeFeed: null,   // the feed currently allowed to play
    muted: !!C.startMuted,
    liked: new Set(),
    saved: new Set(),
    following: new Set(),
    hiddenAt: null,
    started: false,
  };

  // ================================================================ FEED
  // A feed is a vertical, snap-scrolling list of videos. Only one feed is
  // "active" at a time; only the active feed's current video plays.
  function createFeed(container, videos, context, startIndex) {
    const feed = { container, videos, context, items: [], current: -1, active: false, view: null };
    videos.forEach((v, i) => {
      const it = buildItem(v, i, feed);
      container.appendChild(it.root);
      feed.items.push(it);
    });

    feed.setCurrent = function (i, reason) {
      const prev = feed.current;
      if (i === prev || !feed.items[i]) return;
      if (prev >= 0) {
        if (feed.active && feed.view) endView(feed, reason || (i > prev ? "swipe_next" : "swipe_prev"));
        resetItem(feed.items[prev]);
        if (feed.active) {
          L.log("swipe", { context, direction: i > prev ? "next" : "prev", from_index: prev, to_index: i,
            from_video: feed.items[prev].data.id, to_video: feed.items[i].data.id });
        }
      }
      feed.current = i;
      feed.items.forEach((it, k) => { it.video.preload = Math.abs(k - i) <= 1 ? "auto" : "metadata"; });
      if (feed.active) startView(feed);
    };
    feed.activate = function () {
      if (feed.active) return;
      feed.active = true;
      if (feed.current < 0) feed.current = 0;
      startView(feed);
    };
    feed.deactivate = function (reason) {
      if (!feed.active) return;
      if (feed.view) endView(feed, reason || "deactivated");
      feed.active = false;
    };
    feed.destroy = function (reason) {
      feed.deactivate(reason);
      io.disconnect();
      feed.items.forEach((it) => { it.video.pause(); it.video.removeAttribute("src"); it.video.load(); });
    };
    feed.step = function (d) {
      const i = Math.max(0, Math.min(feed.items.length - 1, feed.current + d));
      container.scrollTo({ top: feed.items[i].root.offsetTop, behavior: "smooth" });
    };

    // Which item is on screen? (≥60% visible)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) feed.setCurrent(+e.target.dataset.index);
      });
    }, { root: container, threshold: [0.6] });

    feed.current = Math.max(0, Math.min(videos.length - 1, startIndex || 0));
    if (feed.current > 0) container.scrollTop = feed.items[feed.current].root.offsetTop;
    feed.items.forEach((it) => io.observe(it.root));
    return feed;
  }

  function buildItem(v, i, feed) {
    const p = profileOf(v.profile);
    const root = h(`
      <div class="feed-item${C.videoFit === "contain" ? " fit-contain" : ""}" data-index="${i}">
        <video playsinline webkit-playsinline loop preload="metadata" src="${esc(v.src)}"></video>
        <div class="tap-layer"></div>
        <div class="pause-icon">${ICON.play}</div>
        <div class="rail">
          <div class="rail-avatar">
            <button class="js-avatar" aria-label="Open profile">${avatarHTML(p, 46)}</button>
            ${v.profile === D.selfProfile ? "" : `<button class="follow-badge js-follow" data-profile="${esc(v.profile)}" aria-label="Follow">+</button>`}
          </div>
          <button class="rail-btn js-like" data-like="${esc(v.id)}">${ICON.heart}<span></span></button>
          <button class="rail-btn js-comment">${ICON.comment}<span>${fmt(v.comments || 0)}</span></button>
          <button class="rail-btn js-save" data-save="${esc(v.id)}">${ICON.bookmark}<span></span></button>
          <button class="rail-btn js-share">${ICON.share}<span>${fmt(v.shares || 0)}</span></button>
          <div class="disc"></div>
        </div>
        <div class="meta">
          <button class="user js-user">${esc(p.handle)} ${verifiedHTML(p)}</button>
          <div class="caption">${captionHTML(v.caption)}</div>
          <div class="sound">♫ ${esc(v.sound || "original sound")}</div>
        </div>
        <div class="progress"><div class="bar"></div></div>
      </div>`);
    const it = { root, data: v, video: $("video", root), bar: $(".bar", root), userPaused: false, feed, index: i };
    const vid = it.video;
    const ctx = () => ({ video_id: v.id, context: feed.context, video_time: vid.currentTime });
    const myView = () => (feed.view && feed.view.index === i ? feed.view : null);
    refreshCounts(root, v);
    const fbInit = $(".js-follow", root);
    if (fbInit && S.following.has(v.profile)) { fbInit.classList.add("done"); fbInit.textContent = "✓"; }

    // ----- watch-time accounting from real playback events
    vid.addEventListener("playing", () => { const w = myView(); if (w && w.playStart == null) w.playStart = now(); });
    const stopClock = () => { const w = myView(); if (w && w.playStart != null) { w.playMs += now() - w.playStart; w.playStart = null; } };
    vid.addEventListener("pause", stopClock);
    vid.addEventListener("waiting", () => { stopClock(); const w = myView(); if (w) { w.buffering++; } });
    vid.addEventListener("timeupdate", () => {
      const t = vid.currentTime, dur = vid.duration || 0;
      if (dur) it.bar.style.width = (100 * t / dur).toFixed(2) + "%";
      const w = myView(); if (!w) return;
      if (dur && t < w.lastTime - 0.5 && w.lastTime > dur - 1.0) {
        w.loops++;
        L.log("video_loop", { ...ctx(), video_time: w.lastTime, loop_count: w.loops, duration: dur });
      }
      if (w.loops === 0) w.maxTime = Math.max(w.maxTime, t); else w.maxTime = dur;
      w.lastTime = t;
    });
    vid.addEventListener("error", () => L.log("video_error", { ...ctx(), code: vid.error && vid.error.code, src: v.src }));

    // ----- tap = pause/play, double tap = like
    let tapTimer = null;
    $(".tap-layer", root).addEventListener("click", (e) => {
      if (tapTimer) {
        clearTimeout(tapTimer); tapTimer = null;
        heartBurst(root, e);
        if (!S.liked.has(v.id)) toggleLike(v, "double_tap", ctx());
        else L.log("double_tap", { ...ctx(), already_liked: true });
        return;
      }
      tapTimer = setTimeout(() => { tapTimer = null; togglePause(it); }, 250);
    });

    // ----- right-hand rail
    $(".js-avatar", root).addEventListener("click", () => openProfile(v.profile, "feed_avatar", v));
    $(".js-user", root).addEventListener("click", () => openProfile(v.profile, "feed_username", v));
    const fb = $(".js-follow", root);
    if (fb) fb.addEventListener("click", () => { if (!S.following.has(v.profile)) toggleFollow(v.profile, "feed_badge", ctx()); });
    $(".js-like", root).addEventListener("click", () => toggleLike(v, "button", ctx()));
    $(".js-save", root).addEventListener("click", () => toggleSave(v, ctx()));
    $(".js-comment", root).addEventListener("click", () => { L.log("comment_click", ctx()); toast("Comments are turned off"); });
    $(".js-share", root).addEventListener("click", () => { L.log("share_click", ctx()); toast("Sharing isn't available"); });
    return it;
  }

  function playItem(it) {
    const vid = it.video;
    vid.muted = S.muted;
    const pr = vid.play();
    if (pr && pr.catch) pr.catch((err) => {
      if (err && err.name === "NotAllowedError" && !vid.muted) {
        // Browser blocked sound; fall back to muted autoplay.
        S.muted = true; vid.muted = true;
        vid.play().catch(() => {});
        $("#unmute").hidden = false;
        L.log("autoplay_muted_fallback", { video_id: it.data.id, context: it.feed.context });
      }
    });
  }
  function resetItem(it) {
    it.video.pause();
    try { it.video.currentTime = 0; } catch (e) {}
    it.userPaused = false;
    it.root.classList.remove("paused");
    it.bar.style.width = "0%";
  }

  function startView(feed) {
    const it = feed.items[feed.current];
    if (!it) return;
    feed.view = {
      index: feed.current, videoId: it.data.id, start: now(), playMs: 0, playStart: null,
      pauses: 0, loops: 0, buffering: 0, hiddenMs: 0, maxTime: it.video.currentTime,
      lastTime: it.video.currentTime, startTime: it.video.currentTime,
    };
    L.log("video_view_start", { video_id: it.data.id, context: feed.context, video_time: it.video.currentTime,
      position: feed.current, profile: it.data.profile, resumed: it.video.currentTime > 0.05 });
    if (it.userPaused) return; // came back to a video the participant had paused
    playItem(it);
  }

  function endView(feed, reason) {
    const w = feed.view, it = feed.items[w.index];
    if (w.playStart != null) { w.playMs += now() - w.playStart; w.playStart = null; }
    if (S.hiddenAt != null) w.hiddenMs += now() - S.hiddenAt;
    it.video.pause();
    const dur = it.video.duration || null;
    L.log("video_view_end", {
      video_id: w.videoId, context: feed.context, video_time: it.video.currentTime, position: w.index,
      profile: it.data.profile,
      dwell_ms: Math.round(now() - w.start),        // time the video was on screen
      watch_ms: Math.round(w.playMs),               // time it was actually playing
      hidden_ms: Math.round(w.hiddenMs),            // time the tab/app was in background
      pause_count: w.pauses,
      loop_count: w.loops,
      max_time: w.maxTime == null ? null : Math.round(w.maxTime * 1000) / 1000,
      duration: dur,
      pct_watched: dur ? Math.min(1, Math.round((w.maxTime / dur) * 1000) / 1000) : null,
      completed: !!(dur && (w.loops > 0 || w.maxTime >= dur - 0.3)),
      buffering_count: w.buffering,
      ended_paused: it.userPaused,
      liked: S.liked.has(w.videoId),
      exit_reason: reason,
    });
    feed.view = null;
  }

  function togglePause(it) {
    const feed = it.feed;
    if (!feed.active || feed.current !== it.index) return;
    const base = { video_id: it.data.id, context: feed.context, video_time: it.video.currentTime };
    if (it.video.paused) {
      it.userPaused = false;
      it.root.classList.remove("paused");
      playItem(it);
      L.log("play", base);
    } else {
      it.userPaused = true;
      it.root.classList.add("paused");
      it.video.pause();
      if (feed.view) feed.view.pauses++;
      L.log("pause", { ...base, pause_count: feed.view ? feed.view.pauses : null });
    }
  }

  function heartBurst(root, e) {
    const r = root.getBoundingClientRect();
    const b = h(`<div class="heart-burst">${ICON.heart}</div>`);
    b.style.left = (e.clientX - r.left) + "px";
    b.style.top = (e.clientY - r.top) + "px";
    root.appendChild(b);
    setTimeout(() => b.remove(), 750);
  }

  // ------------------------------------------------------------ reactions
  function refreshCounts(scope, v) {
    (scope || document).querySelectorAll(`[data-like="${CSS.escape(v.id)}"]`).forEach((b) => {
      const on = S.liked.has(v.id);
      b.classList.toggle("liked", on);
      $("span", b).textContent = count(v.likes, on);
    });
    (scope || document).querySelectorAll(`[data-save="${CSS.escape(v.id)}"]`).forEach((b) => {
      const on = S.saved.has(v.id);
      b.classList.toggle("saved", on);
      $("span", b).textContent = count(v.bookmarks, on);
    });
  }
  function toggleLike(v, method, base) {
    const on = !S.liked.has(v.id);
    on ? S.liked.add(v.id) : S.liked.delete(v.id);
    L.log(on ? "like" : "unlike", { ...base, method });
    refreshCounts(document, v);
    document.querySelectorAll(`[data-like="${CSS.escape(v.id)}"]`).forEach((b) => {
      b.classList.remove("pop"); void b.offsetWidth; if (on) b.classList.add("pop");
    });
  }
  function toggleSave(v, base) {
    const on = !S.saved.has(v.id);
    on ? S.saved.add(v.id) : S.saved.delete(v.id);
    L.log(on ? "bookmark" : "unbookmark", base);
    refreshCounts(document, v);
    toast(on ? "Added to Favorites" : "Removed from Favorites");
  }
  function refreshFollow(scope, profileId) {
    const on = S.following.has(profileId);
    const sel = CSS.escape(profileId);
    (scope || document).querySelectorAll(`.js-follow[data-profile="${sel}"]`).forEach((b) => {
      b.classList.toggle("done", on); b.textContent = on ? "✓" : "+";
    });
    document.querySelectorAll(`[data-follow="${sel}"]`).forEach((b) => {
      b.classList.toggle("following", on);
      b.textContent = on ? "Following" : "Follow";
    });
  }
  function toggleFollow(profileId, source, base) {
    const on = !S.following.has(profileId);
    on ? S.following.add(profileId) : S.following.delete(profileId);
    L.log(on ? "follow" : "unfollow", { ...(base || {}), profile: profileId, source });
    refreshFollow(document, profileId);
  }

  // =========================================================== NAVIGATION
  // Decide which feed (if any) may play, based on tab + overlay stack.
  function updateActiveMedia(reason) {
    const top = S.overlays[S.overlays.length - 1];
    let target = null;
    if (top) target = top.feed || null;
    else if (S.tab === "home") target = S.homeFeed;
    if (!S.started) target = null;
    if (S.activeFeed && S.activeFeed !== target) S.activeFeed.deactivate(reason);
    S.activeFeed = target;
    if (target) target.activate();
  }

  function pushOverlay(o) {
    o.openedAt = now();
    $("#overlays").appendChild(o.root);
    S.overlays.push(o);
    void o.root.offsetWidth;
    o.root.classList.add("open");
  }
  function popOverlay(reason, silent) {
    const o = S.overlays.pop();
    if (!o) return;
    if (o.feed) {
      if (S.activeFeed === o.feed) S.activeFeed = null;
      o.feed.destroy(reason);
    }
    L.log(o.type + "_close", { ...(o.meta || {}), duration_ms: Math.round(now() - o.openedAt), reason });
    o.root.classList.remove("open");
    setTimeout(() => o.root.remove(), 250);
    if (!silent) updateActiveMedia(reason);
  }

  function showTab(name, source) {
    // Tabs switched off in config.js: the button stays visible, but tapping it only logs the attempt.
    if ((name === "inbox" && C.allowInbox === false) || (name === "profile" && C.allowOwnProfile === false)) {
      L.log("nav_click", { target: name, available: false, source: source || "nav" });
      toast(name === "inbox" ? "Inbox isn't available" : "Profile isn't available");
      return;
    }
    if (name === "discover" || name === "create") {
      L.log("nav_click", { target: name, available: false });
      toast(name === "create" ? "Posting isn't available" : "Discover isn't available");
      return;
    }
    let closed = false;
    while (S.overlays.length) { popOverlay("tab_change", true); closed = true; }
    if (name === S.tab) {
      L.log("nav_click", { target: name, already_on_tab: true });
      if (closed) updateActiveMedia("tab_change");
      return;
    }
    const prev = S.tab;
    if (S.activeFeed) { S.activeFeed.deactivate("tab_change"); S.activeFeed = null; } // end current video view first
    L.log("tab_leave", { tab: prev, duration_ms: Math.round(now() - S.tabEnteredAt) });
    L.log("tab_view", { tab: name, from: prev, source: source || "nav" });
    S.tab = name;
    S.tabEnteredAt = now();
    updateActiveMedia("tab_change");
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    $("#nav").classList.toggle("light", name !== "home");
    if (name === "inbox") $("#view-inbox .page").scrollTop = 0;
  }

  // ============================================================= PROFILES
  function videosOf(profileId) { return D.videos.filter((v) => v.profile === profileId); }

  function renderProfile(profileId, opts) {
    const p = profileOf(profileId);
    const isSelf = profileId === D.selfProfile;
    const vids = videosOf(profileId);
    const page = h(`
      <div class="page">
        <div class="page-head">
          ${opts.back ? `<button class="back js-back">${ICON.back}</button>` : ""}
          ${esc(isSelf ? p.name : p.handle)}
        </div>
        <div class="profile-top">
          ${avatarHTML(p, 96)}
          <div class="handle">@${esc(p.handle)} ${verifiedHTML(p)}</div>
          <div class="stats">
            <div><b>${esc(fmt(p.following || 0))}</b><span>Following</span></div>
            <div><b>${esc(fmt(p.followers || 0))}</b><span>Followers</span></div>
            <div><b>${esc(fmt(p.likes || 0))}</b><span>Likes</span></div>
          </div>
          <div class="profile-actions">
            ${isSelf
              ? `<button class="btn grey js-edit">Edit profile</button><button class="btn grey js-shareprof">Share profile</button>`
              : `<button class="btn primary-btn js-followbtn" data-follow="${esc(profileId)}">Follow</button><button class="btn grey js-msg">Message</button>`}
          </div>
          ${p.bio ? `<div class="bio">${esc(p.bio)}</div>` : ""}
        </div>
        <div class="profile-tabs">
          <div class="active">${ICON.grid}</div>
          <div class="js-liked-tab">${ICON.lock}</div>
        </div>
        <div class="grid"></div>
      </div>`);
    const grid = $(".grid", page);
    if (!vids.length) grid.outerHTML = `<div class="empty">No videos yet</div>`;
    vids.forEach((v, i) => {
      const cell = h(`
        <div class="grid-item">
          ${v.thumb ? `<img src="${esc(v.thumb)}" alt="">` : `<video muted playsinline preload="metadata" src="${esc(v.src)}#t=0.5"></video>`}
          <div class="views">${ICON.play}${esc(v.views === "" || v.views == null ? "" : fmt(v.views))}</div>
        </div>`);
      cell.addEventListener("click", () => openPlayer(profileId, i, opts.context));
      grid.appendChild(cell);
    });
    const ctxBase = { profile: profileId, context: opts.context };
    if (opts.back) $(".js-back", page).addEventListener("click", () => popOverlay("back"));
    const fbtn = $(".js-followbtn", page);
    if (fbtn) fbtn.addEventListener("click", () => toggleFollow(profileId, "profile_page", { context: opts.context }));
    const mbtn = $(".js-msg", page);
    if (mbtn) mbtn.addEventListener("click", () => {
      const conv = D.conversations.find((c) => c.profile === profileId);
      openChat(conv || { id: "new_" + profileId, profile: profileId, messages: [] }, "profile_message_button");
    });
    const e1 = $(".js-edit", page), e2 = $(".js-shareprof", page);
    if (e1) e1.addEventListener("click", () => { L.log("edit_profile_click", ctxBase); toast("Editing isn't available"); });
    if (e2) e2.addEventListener("click", () => { L.log("share_profile_click", ctxBase); toast("Sharing isn't available"); });
    $(".js-liked-tab", page).addEventListener("click", () => { L.log("profile_liked_tab_click", ctxBase); toast("Liked videos are private"); });
    let lastScrollLog = 0;
    page.addEventListener("scroll", () => {
      if (now() - lastScrollLog < 1000) return; lastScrollLog = now();
      L.log("profile_scroll", { ...ctxBase, scroll_top: Math.round(page.scrollTop) });
    }, { passive: true });
    return page;
  }

  function openProfile(profileId, source, fromVideo) {
    // Profiles switched off in config.js: log the tap but don't navigate.
    if (C.allowProfilesFromFeed === false && /^feed/.test(source || "")) {
      L.log("profile_click_blocked", { profile: profileId, source, video_id: fromVideo ? fromVideo.id : null });
      toast("Profiles aren't available");
      return;
    }
    const n = S.overlays.length;
    const top = S.overlays[n - 1], below = S.overlays[n - 2];
    if (top && top.type === "profile" && top.meta.profile === profileId) return;
    // Tapping the avatar inside a profile's player just goes back to that profile.
    if (top && top.type === "player" && below && below.type === "profile" && below.meta.profile === profileId) {
      popOverlay("back_to_profile");
      return;
    }
    if (profileId === D.selfProfile && !n) { showTab("profile", source); return; }
    const context = "profile:" + profileId;
    const meta = { profile: profileId, source, from_video: fromVideo ? fromVideo.id : null };
    const root = h(`<div class="overlay light-page"></div>`);
    root.appendChild(renderProfile(profileId, { back: true, context }));
    pushOverlay({ type: "profile", root, meta });
    updateActiveMedia("profile_open");
    L.log("profile_open", meta);
    refreshFollow(root, profileId);
  }

  function openPlayer(profileId, index, context) {
    const vids = videosOf(profileId);
    const meta = { profile: profileId, start_video: vids[index] && vids[index].id, start_index: index };
    const root = h(`<div class="overlay dark"><button class="back-float">${ICON.back}</button><div class="feed"></div></div>`);
    const o = { type: "player", root, meta };
    pushOverlay(o);
    L.log("player_open", meta);
    o.feed = createFeed($(".feed", root), vids, (context || "profile:" + profileId) + ":player", index);
    refreshFollow(root, profileId);
    $(".back-float", root).addEventListener("click", () => popOverlay("back"));
    updateActiveMedia("player_open");
  }

  // ================================================================ INBOX
  function renderInbox() {
    const page = h(`
      <div class="page">
        <div class="page-head">Inbox</div>
        <div class="row js-sys" data-k="new_followers"><div class="icon-circle" style="background:#20a5f5">${ICON.people}</div><div class="txt"><div class="title">New followers</div><div class="sub">See who followed you</div></div></div>
        <div class="row js-sys" data-k="activity"><div class="icon-circle" style="background:#fe2c55">${ICON.bell}</div><div class="txt"><div class="title">Activity</div><div class="sub">Likes and comments on your videos</div></div></div>
        <div class="row js-sys" data-k="system"><div class="icon-circle" style="background:#161823">${ICON.info}</div><div class="txt"><div class="title">System notifications</div><div class="sub">Account updates</div></div></div>
        <div class="section-label">Messages</div>
        <div class="convs"></div>
      </div>`);
    page.querySelectorAll(".js-sys").forEach((r) => r.addEventListener("click", () => {
      L.log("inbox_row_click", { row: r.dataset.k }); toast("Nothing new");
    }));
    const list = $(".convs", page);
    D.conversations.forEach((c) => {
      const p = profileOf(c.profile);
      const last = c.messages[c.messages.length - 1];
      const row = h(`
        <div class="row">
          ${avatarHTML(p, 52)}
          <div class="txt"><div class="title">${esc(p.name)}</div>
          <div class="sub${c.unread ? " unread" : ""}">${last ? esc((last.from === "me" ? "You: " : "") + last.text) : ""}</div></div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="time">${esc(c.time || "")}</span>${c.unread ? '<span class="dot"></span>' : ""}</div>
        </div>`);
      row.addEventListener("click", () => {
        c.unread = false; $(".sub", row).classList.remove("unread"); const d = $(".dot", row); if (d) d.remove();
        openChat(c, "inbox");
      });
      list.appendChild(row);
    });
    return page;
  }

  function openChat(conv, source) {
    if (C.allowInbox === false) {
      L.log("chat_click_blocked", { conversation: conv.id, profile: conv.profile, source });
      toast("Messages aren't available");
      return;
    }
    const p = profileOf(conv.profile);
    const meta = { conversation: conv.id, profile: conv.profile, source };
    const root = h(`
      <div class="overlay"><div class="chat">
        <div class="page-head"><button class="back js-back">${ICON.back}</button>${avatarHTML(p, 28)}<span>${esc(p.name)}</span></div>
        <div class="chat-msgs"></div>
        <div class="chat-input"><input placeholder="Send a message..." readonly></div>
      </div></div>`);
    const msgs = $(".chat-msgs", root);
    conv.messages.forEach((m) => {
      msgs.appendChild(h(`<div class="bubble-row ${m.from === "me" ? "me" : ""}">${m.from === "me" ? "" : avatarHTML(p, 28)}<div class="bubble">${esc(m.text)}</div></div>`));
    });
    $(".js-back", root).addEventListener("click", () => popOverlay("back"));
    $("input", root).addEventListener("click", () => { L.log("chat_input_click", meta); toast("Messaging is turned off"); });
    pushOverlay({ type: "chat", root, meta });
    updateActiveMedia("chat_open");
    L.log("chat_open", meta);
  }

  // =============================================================== DEBUG
  function setupDebug() {
    const on = C.debug || new URLSearchParams(location.search).get("debug") === "1";
    if (!on) return;
    const panel = $("#debug"); panel.hidden = false;
    const list = $("#dbg-list");
    const render = (ev) => {
      $("#dbg-count").textContent = L.all().length + " events";
      const ids = L.ids();
      $("#dbg-ids").textContent = "pid: " + (ids.participant_id || "–") + "  session: " + (ids.session_id || "–").slice(0, 8);
      $("#dbg-status").textContent = "backend: " + L.status() + (L.pending() ? "  (" + L.pending() + " queued)" : "");
      if (!ev) return;
      const d = Object.assign({}, ev.data);
      const bits = [ev.video_id && "video=" + ev.video_id, ev.context && "ctx=" + ev.context,
        ev.video_time != null && "t=" + ev.video_time.toFixed(1)].filter(Boolean).join(" ");
      const li = document.createElement("li");
      li.innerHTML = `<i>${(ev.ms_since_start / 1000).toFixed(1)}s</i> <b>${esc(ev.event_type)}</b> ${esc(bits)}<br><i>${esc(JSON.stringify(d))}</i>`;
      list.prepend(li);
      while (list.children.length > 200) list.lastChild.remove();
    };
    L.onChange(render);
    L.all().forEach(render);
    render(null);
    $("#dbg-toggle").addEventListener("click", () => {
      panel.classList.toggle("collapsed");
      $("#dbg-toggle").textContent = panel.classList.contains("collapsed") ? "show" : "hide";
    });
    $("#dbg-csv").addEventListener("click", () => L.download("csv"));
    $("#dbg-json").addEventListener("click", () => L.download("json"));
    if (window.innerWidth < 1000) $("#dbg-toggle").click();
  }

  // ================================================================ START
  function init() {
    document.title = C.appName || "Clips";
    const params = new URLSearchParams(location.search);
    const urlPid = params.get(C.participantParam || "pid");

    // Build feed order
    let feedVideos = D.videos.filter((v) => v.inFeed !== false);
    if (C.feedOrder === "shuffle") feedVideos = seededShuffle(feedVideos, hashStr(urlPid || String(Math.random())));

    // Build screens (hidden behind the start screen)
    S.homeFeed = createFeed($("#home-feed"), feedVideos, "home");
    $("#view-inbox").appendChild(renderInbox());
    $("#view-profile").appendChild(renderProfile(D.selfProfile, { back: false, context: "profile:self" }));
    $("#view-home").classList.add("active");

    document.querySelectorAll(".nav-btn").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab, "nav")));
    document.querySelectorAll("[data-top]").forEach((b) => b.addEventListener("click", () => {
      L.log("top_tab_click", { target: b.dataset.top });
      if (b.dataset.top === "following") toast("Following feed isn't available");
    }));
    $("#unmute").addEventListener("click", () => {
      S.muted = false;
      $("#unmute").hidden = true;
      const f = S.activeFeed;
      if (f && f.items[f.current]) f.items[f.current].video.muted = false;
      L.log("unmute", {});
    });
    document.addEventListener("keydown", (e) => {
      if (!S.activeFeed) return;
      if (e.key === "ArrowDown") { e.preventDefault(); S.activeFeed.step(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); S.activeFeed.step(-1); }
      if (e.key === " ") { e.preventDefault(); const f = S.activeFeed; togglePause(f.items[f.current]); }
    });

    // Start screen
    $("#start-btn").textContent = C.startButtonText || "Start";
    $("#start-btn").disabled = false;
    const input = $("#pid-input");
    if (!urlPid && C.requireParticipantId) input.hidden = false;
    $("#start-btn").addEventListener("click", () => {
      const pid = urlPid || input.value.trim();
      if (!pid && C.requireParticipantId) { $("#start-err").textContent = "Please enter your participant ID."; return; }
      start(pid || null, feedVideos);
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") $("#start-btn").click(); });

    setupDebug();
  }

  function start(pid, feedVideos) {
    L.init(pid);
    L.log("session_start", {
      user_agent: navigator.userAgent,
      screen_w: window.screen.width, screen_h: window.screen.height,
      viewport_w: window.innerWidth, viewport_h: window.innerHeight,
      feed_order: feedVideos.map((v) => v.id),
      feed_order_mode: C.feedOrder || "fixed",
      content_source: contentSource,
      url: location.origin + location.pathname,
    });
    $("#start").hidden = true;
    S.started = true;
    S.tabEnteredAt = now();
    L.log("tab_view", { tab: "home", from: null, source: "start" });
    updateActiveMedia("start");

    // App backgrounded / tab switched
    document.addEventListener("visibilitychange", () => {
      const f = S.activeFeed, it = f && f.view ? f.items[f.current] : null;
      if (document.hidden) {
        S.hiddenAt = now();
        L.log("app_hidden", it ? { video_id: it.data.id, context: f.context, video_time: it.video.currentTime } : {});
        if (it) it.video.pause();
        L.flush(true);
      } else {
        const away = S.hiddenAt != null ? now() - S.hiddenAt : 0;
        if (f && f.view) f.view.hiddenMs += away;
        S.hiddenAt = null;
        L.log("app_visible", { away_ms: Math.round(away) });
        if (it && !it.userPaused) playItem(it);
      }
    });
    window.addEventListener("pagehide", () => {
      if (S.activeFeed) S.activeFeed.deactivate("page_exit");
      L.log("session_end", { reason: "page_exit" });
      L.flush(true);
    });

    if (C.sessionMinutes) setTimeout(endSession, C.sessionMinutes * 60000);
  }

  function endSession() {
    while (S.overlays.length) popOverlay("session_end", true);
    if (S.activeFeed) S.activeFeed.deactivate("session_end");
    S.activeFeed = null; S.started = false;
    L.log("session_end", { reason: "time_limit" });
    L.flush(false);
    $("#end-msg").textContent = C.endMessage || "";
    if (C.endRedirectUrl) {
      const a = $("#end-link");
      a.href = C.endRedirectUrl.replace("{pid}", encodeURIComponent(L.ids().participant_id || ""));
      a.hidden = false;
    }
    $("#end").hidden = false;
  }

  // ================================================================= BOOT
  // Load content.xlsx, then build the app.
  function boot() {
    document.title = C.appName || "Clips";
    $("#start-title").textContent = C.startTitle || "Welcome";
    $("#start-msg").textContent = C.startMessage || "";
    const file = C.contentFile || "content.xlsx";
    const debug = C.debug || new URLSearchParams(location.search).get("debug") === "1";

    const showMsgs = (list, cls) => list.forEach((m) => {
      const li = document.createElement("li"); li.className = cls; li.textContent = m; $("#load-msgs").appendChild(li);
    });
    const handle = (res, source) => {
      $("#load-msgs").innerHTML = "";
      if (res.warnings.length) console.warn("[content] spreadsheet warnings:\n" + res.warnings.join("\n"));
      if (res.errors.length) {
        $("#start-btn").textContent = "Can't start";
        $("#start-err").textContent = "There's a problem with content.xlsx:";
        showMsgs(res.errors, "err");
        showMsgs(res.warnings, "warn");
        return;
      }
      if (debug) showMsgs(res.warnings, "warn");
      D = res.content;
      contentSource = source;
      $("#local-load").hidden = true;
      $("#start-err").textContent = "";
      init();
    };
    const fail = (msg) => { $("#start-btn").textContent = "Can't load content"; $("#start-err").textContent = msg; };

    window.ContentLoader.fromUrl(file)
      .then((res) => handle(res, file))
      .catch((err) => {
        if (location.protocol === "file:") {
          // Browsers block reading files from a page opened by double-click.
          $("#start-btn").hidden = true;
          $("#local-load").hidden = false;
          $("#local-file").addEventListener("change", (e) => {
            const f = e.target.files[0];
            if (!f) return;
            window.ContentLoader.fromFile(f)
              .then((res) => { if (!res.errors.length) $("#start-btn").hidden = false; handle(res, "local file: " + f.name); })
              .catch((er) => fail("Couldn't read that file: " + er.message));
          });
        } else {
          fail(err.message);
        }
      });
  }

  boot();
})();
