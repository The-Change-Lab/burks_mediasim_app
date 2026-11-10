// =====================================================================
//  STUDY SETTINGS: edit this file to configure the app.
// =====================================================================
window.APP_CONFIG = {
  // App name shown on the browser tab.
  appName: "Clips",

  // ---- Content --------------------------------------------------------
  // The spreadsheet with all videos, profiles and messages. It sits in the
  // same folder as index.html. The name must match exactly.
  contentFile: "content_110927.xlsx",

  // The folder (next to index.html) that holds the video files named in the
  // spreadsheet's "file" column. The name must match exactly.
  videoFolder: "studyvids_11092026",

  // Google Drive hosting is switched off (videos load from videoFolder above).
  googleDrive: {
    apiKey: "AIzaSyC_ME3Hd6J-k_stPN2aHXyui6I5Qt9WN18",
    videoFolder: "",
  },

  // ---- Participants ---------------------------------------------------
  // The participant ID comes from the link, e.g.  .../?pid=${e://Field/ResponseID}
  participantParam: "pid",
  // If a link has no ?pid=, ask the participant to type one in.
  requireParticipantId: true,

  // Start screen text.
  startTitle: "Welcome",
  startMessage:
    "You'll scroll through a short-video feed like you normally would. Tap Start when you're ready.",
  startButtonText: "Start",

  // ---- Feed -----------------------------------------------------------
  // "fixed"   = videos play in the spreadsheet's row order (play_order)
  // "shuffle" = random order per participant
  feedOrder: "fixed",
  // "auto"    = vertical videos fill the screen; horizontal/square ones are
  //             shown in full with black bars (like TikTok)
  videoFit: "auto",
  startMuted: false,
  // Press and hold the right half of a video to play it faster.
  holdToSpeedUp: true,
  holdSpeed: 2,
  // Lines of caption shown before participants tap "more".
  captionLines: 2,

  // ---- What participants can open --------------------------------------
  // Only the For You feed is open. Other pages stay visible but show a short
  // "isn't available" message (the tap is still logged).
  blockedMessage: null, // e.g. "This page cannot be accessed" to use one message everywhere
  allowProfilesFromFeed: false,
  allowInbox: false,
  allowOwnProfile: false,

  // ---- Session end (optional) ----------------------------------------
  // Minutes until the session ends automatically; null = no limit.
  sessionMinutes: null,
  endMessage: "Thanks! This part of the study is complete.",
  // Optional link to send participants back to Qualtrics. {pid} is filled in.
  endRedirectUrl: null, // e.g. "https://stanford.qualtrics.com/jfe/form/SV_xxx?pid={pid}"

  // ---- Data collection ------------------------------------------------
  // IMPORTANT: fill these in before running participants, or no data is saved.
  supabase: {
    url: "https://ocdynnpefmwzjzwmpfuw.supabase.co",       // e.g. "https://abcdefgh.supabase.co"
    anonKey: "sb_publishable_fd4qSVz0TAxtp85KsbJDFw_1Fcd5hCd",   // your project's anon / publishable key (safe to be public)
    table: "events",
  },
  flushIntervalMs: 5000,

  // Show the live event log. You can also add ?debug=1 to the link.
  debug: false,
  consoleLog: false,
};
