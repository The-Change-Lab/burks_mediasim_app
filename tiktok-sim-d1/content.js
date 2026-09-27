// =====================================================================
//  CONTENT: profiles, videos and (fake) messages.
//  To add your own videos: put the .mp4 in the /videos folder and add
//  an entry to `videos` below.
// =====================================================================
window.CONTENT = {
  // Which profile is shown on the "Profile" tab (the participant's own).
  selfProfile: "me",

  // ---- Profiles ------------------------------------------------------
  // avatar: path to an image (e.g. "avatars/maya.jpg") or leave null to
  //         show initials on a colored circle.
  profiles: {
    me: {
      handle: "your.profile", name: "You", avatar: null, color: "#6b7280",
      bio: "Just here for the videos", following: "148", followers: "96", likes: "1.1K",
    },
    maya: {
      handle: "maya.moves", name: "Maya", avatar: null, color: "#e4405f", verified: true,
      bio: "dance + daily vlogs ✨", following: "312", followers: "1.2M", likes: "24.5M",
    },
    dani: {
      handle: "chef.dani", name: "Dani Cooks", avatar: null, color: "#f59e0b",
      bio: "15-minute dinners 🍳", following: "88", followers: "430K", likes: "6.7M",
    },
    rio: {
      handle: "city.skater", name: "Rio", avatar: null, color: "#10b981",
      bio: "skating every street in the city", following: "501", followers: "78K", likes: "990K",
    },
    lu: {
      handle: "study.with.lu", name: "Lu", avatar: null, color: "#8b5cf6",
      bio: "grad school survival tips 📚", following: "210", followers: "52K", likes: "610K",
    },
  },

  // ---- Videos ------------------------------------------------------
  //  id        unique ID (this is what shows up in your data)
  //  src       path to the video file
  //  profile   which profile posted it (key from `profiles` above)
  //  inFeed    true = appears in the Home feed; false = only on the profile
  //  thumb     optional image for the profile grid (otherwise a frame of the video)
  videos: [
    { id: "v1", src: "videos/video1.mp4", profile: "maya", inFeed: true,
      caption: "trying the new trend #dance #fyp", sound: "original sound - maya.moves",
      likes: 128400, comments: 1320, bookmarks: 5400, shares: 880, views: "1.4M" },
    { id: "v2", src: "videos/video2.mp4", profile: "dani", inFeed: true,
      caption: "garlic butter pasta in 12 minutes #cooking #easyrecipe", sound: "original sound - chef.dani",
      likes: 45100, comments: 610, bookmarks: 9800, shares: 2100, views: "512K" },
    { id: "v3", src: "videos/video3.mp4", profile: "rio", inFeed: true,
      caption: "downhill at sunrise #skate", sound: "lofi beat - city.skater",
      likes: 8300, comments: 97, bookmarks: 310, shares: 44, views: "88K" },
    { id: "v4", src: "videos/video4.mp4", profile: "lu", inFeed: true,
      caption: "how I plan my week in 5 minutes #studytok", sound: "original sound - study.with.lu",
      likes: 22700, comments: 402, bookmarks: 6100, shares: 950, views: "240K" },
    { id: "v5", src: "videos/video5.mp4", profile: "maya", inFeed: true,
      caption: "day in my life ☀️", sound: "original sound - maya.moves",
      likes: 96200, comments: 870, bookmarks: 2200, shares: 410, views: "1.1M" },
    { id: "v6", src: "videos/video6.mp4", profile: "dani", inFeed: true,
      caption: "the only salad I actually crave #healthy", sound: "original sound - chef.dani",
      likes: 31800, comments: 288, bookmarks: 7300, shares: 1200, views: "390K" },
    { id: "v7", src: "videos/video7.mp4", profile: "rio", inFeed: true,
      caption: "rate this trick 1-10", sound: "lofi beat - city.skater",
      likes: 14900, comments: 1900, bookmarks: 150, shares: 60, views: "150K" },
    // Profile-only videos (not in the Home feed)
    { id: "v8", src: "videos/video8.mp4", profile: "me", inFeed: false,
      caption: "my first post!", sound: "original sound - your.profile",
      likes: 42, comments: 3, bookmarks: 1, shares: 0, views: "310" },
    { id: "v9", src: "videos/video4.mp4", profile: "maya", inFeed: false,
      caption: "throwback 💫", sound: "original sound - maya.moves",
      likes: 50300, comments: 400, bookmarks: 900, shares: 120, views: "620K" },
  ],

  // ---- Messages (display only) -------------------------------------
  conversations: [
    { id: "c1", profile: "maya", unread: true, time: "2m",
      messages: [
        { from: "them", text: "omg did you see the new trend??" },
        { from: "me", text: "yes I'm obsessed" },
        { from: "them", text: "we have to try it this weekend" },
      ] },
    { id: "c2", profile: "lu", unread: false, time: "1h",
      messages: [
        { from: "me", text: "that planner video was so helpful" },
        { from: "them", text: "thank you!! more coming soon 📚" },
      ] },
    { id: "c3", profile: "dani", unread: false, time: "3d",
      messages: [
        { from: "them", text: "sent you the recipe!" },
      ] },
  ],
};
