// =====================================================================
//  EVENT LOGGER: records every interaction and sends it to Supabase
//  (if configured). Also keeps everything in memory for the debug panel
//  and CSV download.
// =====================================================================
window.Logger = (function () {
  const cfg = window.APP_CONFIG;
  const sb = cfg.supabase || {};
  const remoteOn = () => !!(sb.url && sb.anonKey);

  let pid = null, sid = null, seq = 0, t0 = performance.now();
  const all = [];
  let queue = [];
  let inflight = false;
  let status = remoteOn() ? "waiting" : "off (no Supabase configured)";
  const listeners = [];

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function init(participantId) {
    pid = participantId || null;
    sid = uuid();
    t0 = performance.now();
    if (remoteOn()) setInterval(() => flush(false), cfg.flushIntervalMs || 5000);
  }

  function log(type, data) {
    data = data || {};
    const { video_id = null, context = null, video_time = null, ...rest } = data;
    const ev = {
      session_id: sid,
      participant_id: pid,
      seq: ++seq,
      event_type: type,
      video_id,
      context,
      video_time: video_time == null ? null : Math.round(video_time * 1000) / 1000,
      client_ts: new Date().toISOString(),
      ms_since_start: Math.round(performance.now() - t0),
      data: rest,
    };
    all.push(ev);
    if (remoteOn()) queue.push(ev);
    if (cfg.consoleLog) console.log("[event]", type, ev);
    listeners.forEach((f) => { try { f(ev); } catch (e) {} });
    if (queue.length >= 40) flush(false);
    return ev;
  }

  async function flush(keepalive) {
    if (!remoteOn() || !queue.length) return;
    if (inflight && !keepalive) return;
    const batch = queue.splice(0, 100);
    inflight = true;
    const headers = {
      apikey: sb.anonKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };
    // Legacy anon keys are JWTs (start with "eyJ") and also go in Authorization.
    if (sb.anonKey.startsWith("eyJ")) headers.Authorization = "Bearer " + sb.anonKey;
    try {
      const res = await fetch(sb.url.replace(/\/$/, "") + "/rest/v1/" + (sb.table || "events"), {
        method: "POST", headers, body: JSON.stringify(batch), keepalive: !!keepalive,
      });
      if (!res.ok) throw new Error(res.status + " " + (await res.text()).slice(0, 200));
      status = "ok (last sent " + new Date().toLocaleTimeString() + ")";
    } catch (e) {
      queue = batch.concat(queue); // put back and retry next time
      status = "error: " + e.message;
      console.warn("[logger] send failed", e);
    } finally {
      inflight = false;
      listeners.forEach((f) => { try { f(null); } catch (e) {} });
    }
    if (queue.length >= 100 && !keepalive) flush(false);
  }

  const COLS = ["session_id", "participant_id", "seq", "event_type", "video_id", "context",
    "video_time", "client_ts", "ms_since_start", "data"];

  function toCSV() {
    const q = (v) => {
      if (v == null) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return [COLS.join(",")].concat(all.map((e) => COLS.map((c) => q(e[c])).join(","))).join("\n");
  }

  function download(kind) {
    const text = kind === "json" ? JSON.stringify(all, null, 2) : toCSV();
    const blob = new Blob([text], { type: kind === "json" ? "application/json" : "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "events_" + (pid || "nopid") + "_" + (sid || "").slice(0, 8) + "." + kind;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return {
    init, log, flush, download,
    all: () => all,
    pending: () => queue.length,
    status: () => status,
    ids: () => ({ participant_id: pid, session_id: sid }),
    onChange: (f) => listeners.push(f),
  };
})();
