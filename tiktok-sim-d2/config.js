// =====================================================================
//  STUDY SETTINGS: edit this file to configure the app.
// =====================================================================
window.APP_CONFIG = {
  // App name shown on the start screen and browser tab.
  appName: "Clips",

  // The spreadsheet with all videos, profiles and messages.
  contentFile: "content.xlsx",

  // ---- Participants ------------------------------------------------
  // Participant ID is read from the URL, e.g.  .../index.html?pid=12345
  participantParam: "pid",
  // If there's no ?pid= in the URL, ask the participant to type one in.
  requireParticipantId: true,

  // Text shown on the start screen (before the feed begins).
  startTitle: "Welcome",
  startMessage:
    "You'll scroll through a short-video feed like you normally would. Tap Start when you're ready.",
  startButtonText: "Start",

  // ---- Feed ----------------------------------------------------------
  // "fixed"   = videos appear in the row order of the Videos tab in content.xlsx
  // "shuffle" = random order per participant (same order if they reload)
  feedOrder: "fixed",
  // "cover" fills the screen (crops edges); "contain" shows the whole video.
  videoFit: "cover",
  // Start with sound muted? (Browsers may force mute until a tap anyway.)
  startMuted: false,

  // ---- Session end (optional) ---------------------------------------
  // Set a number of minutes to end the session automatically; null = no limit.
  sessionMinutes: null,
  endMessage: "Thanks! This part of the study is complete.",
  // Optional link to send participants back to (e.g. your Qualtrics survey).
  // {pid} is replaced with the participant ID.
  endRedirectUrl: null, // e.g. "https://stanford.qualtrics.com/jfe/form/SV_xxx?pid={pid}"

  // ---- Data collection ----------------------------------------------
  // Leave url/anonKey blank to run without a backend (events are still
  // shown in the debug panel and can be downloaded as CSV).
  supabase: {
    url: "https://ocdynnpefmwzjzwmpfuw.supabase.co",       // e.g. "https://abcdefgh.supabase.co"
    anonKey: "sb_publishable_fd4qSVz0TAxtp85KsbJDFw_1Fcd5hCd",   // your project's anon / publishable key (safe to be public)
    table: "events",
  },
  flushIntervalMs: 5000, // how often events are sent to the backend

  // Show the live event log panel. You can also add ?debug=1 to the URL.
  debug: false,
  consoleLog: true,
};
