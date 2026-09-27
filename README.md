# Short-Video Feed Simulator

A browser-based simulation of a short-video app (vertical scrolling feed, profiles, inbox) that logs detailed viewing behavior for research.

It is plain HTML/CSS/JavaScript: no build step and nothing to install. It runs on GitHub Pages for free.

---

## 1. Try it on your computer

Open `index.html` in Chrome, Safari or Firefox by double-clicking it. Add `?debug=1` to the end of the address to see the live event log, e.g.

```
file:///Users/you/Downloads/tiktok-sim/index.html?debug=1&pid=test1
```

- **Scroll**: mouse wheel, trackpad, swipe (on phones) or ↑/↓ arrow keys
- **Pause/play**: tap the video (or press space)
- **Like**: double-tap or tap the heart
- **Profiles**: tap a creator's avatar or @username, then tap any video in their grid
- **Inbox / Profile**: bottom navigation

---

## 2. Put it on GitHub (no coding tools needed)

1. **Create a GitHub account** at <https://github.com> if you don't have one.
   *Tip: as a Stanford student you can get GitHub Pro free through the [GitHub Student Developer Pack](https://education.github.com/pack), which lets you publish from a private repository.*
2. Click the **+** (top right) → **New repository**.
   - Name it, e.g. `feed-study`
   - Choose **Public** (required for free GitHub Pages unless you have Pro)
   - Click **Create repository**
3. On the new empty repo page, click **"uploading an existing file"**.
4. Open the unzipped `tiktok-sim` folder on your computer, select **everything inside it** (`index.html`, `app.js`, `videos/`, etc.; not the folder itself) and drag it into the browser window.
5. Scroll down and click **Commit changes**.
6. Go to **Settings → Pages**. Under *Build and deployment*, set **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, then **Save**.
7. After about a minute, refresh the page. Your site's address will appear at the top, like:
   `https://YOUR-USERNAME.github.io/feed-study/`

Send participants: `https://YOUR-USERNAME.github.io/feed-study/?pid=THEIR_ID`

**To update later:** open a file on GitHub → pencil icon ✏️ → edit → **Commit changes**, or use **Add file → Upload files** to replace or add files. The site updates within a minute or two.

> **Video size limits:** GitHub's web uploader accepts files up to 25 MB each, and repositories should stay under about 1 GB. Compress videos (720p or lower, H.264 MP4). If you have many or large videos, host them in Supabase Storage (below) and put the full URL in `src` in `content.js`.

---

## 3. Collect data with Supabase (free)

Without this step, events are only visible in the debug panel. You can download them there as CSV.

1. Create an account at <https://supabase.com> → **New project** (any name and password; pick a region near your participants).
2. Open **SQL Editor** → **New query**, paste all of `supabase/schema.sql`, and click **Run**.
3. Go to **Project Settings → API Keys** (or **Connect**). Copy:
   - the **Project URL** (`https://xxxx.supabase.co`)
   - the **anon** or **publishable** key
4. In `config.js` fill in:
   ```js
   supabase: { url: "https://xxxx.supabase.co", anonKey: "PASTE_KEY", table: "events" },
   ```
   The anon/publishable key is meant to be public. The security rules in `schema.sql` let the website **add** rows but not **read** them. **Never** paste the `service_role` or secret key here.
5. Upload the updated `config.js` to GitHub, open your site with `?debug=1`, and check the panel says `backend: ok`.
6. View the data in Supabase under **Table Editor → events**. Use **Export → CSV** to download it. The `video_views` view gives one tidy row per video view.

---

## 4. Customize

| What | Where |
|---|---|
| Your videos, captions, like counts, profiles, fake messages | `content.js` |
| Start-screen text, shuffle order, time limit, redirect back to Qualtrics, Supabase keys | `config.js` |
| Colors/layout | `styles.css` |

**Adding a video:** put `myclip.mp4` in `videos/`, then add a line to `videos` in `content.js`:
```js
{ id: "v10", src: "videos/myclip.mp4", profile: "maya", inFeed: true,
  caption: "...", sound: "original sound", likes: 1000, comments: 20, bookmarks: 5, shares: 2, views: "12K" },
```
Set `inFeed: false` to show a video only on the creator's profile. Avatars can be images: `avatar: "avatars/maya.jpg"`.

**Qualtrics/Prolific:** link to the site with `?pid=${e://Field/ResponseID}` (Qualtrics) or `?pid={{%PROLIFIC_PID%}}` (Prolific). Set `sessionMinutes` and `endRedirectUrl` in `config.js` to send people back automatically.

---

## 5. What gets recorded

Every row has `participant_id`, `session_id`, `event_type`, `video_id`, `context` (`home`, `profile:<id>`, `profile:<id>:player`), `video_time` (seconds into the video), `client_ts`, `ms_since_start`, and extra details in `data`.

| event_type | Meaning / key fields in `data` |
|---|---|
| `session_start` / `session_end` | device, screen size, feed order |
| `video_view_start` | a video became the one on screen (`position`, `resumed`) |
| **`video_view_end`** | **main summary row**: `dwell_ms` (time on screen), `watch_ms` (time actually playing), `pause_count`, `loop_count`, `pct_watched`, `completed`, `hidden_ms` (time the app was in the background), `liked`, `exit_reason` (`swipe_next`, `swipe_prev`, `profile_open`, `tab_change`, `back`, `page_exit`) |
| `pause` / `play` | participant tapped to pause/resume |
| `video_loop` | video finished and restarted |
| `swipe` | `direction`, `from_video`, `to_video` |
| `like` / `unlike` | `method`: `button` or `double_tap` |
| `bookmark`, `comment_click`, `share_click` | rail buttons |
| `follow` / `unfollow` | `profile`, `source` |
| `profile_open` / `profile_close` | `source`, `from_video`, `duration_ms` |
| `player_open` / `player_close` | opened a video from a profile grid |
| `profile_scroll` | scrolling on a profile page (max 1/sec) |
| `tab_view` / `tab_leave` | Home / Inbox / Profile, with `duration_ms` |
| `chat_open` / `chat_close` | opened a conversation |
| `app_hidden` / `app_visible` | switched tabs/apps (`away_ms`) |
| `autoplay_muted_fallback`, `unmute` | browser blocked sound until a tap |

---

## Notes

- Browsers only allow autoplay with sound after a tap, which is why there's a Start screen. If a browser still blocks sound, a "Tap to unmute" button appears and this is logged.
- Data sent within the last few seconds before someone closes the tab is sent with `keepalive`. This is reliable in modern browsers but not guaranteed.
- If your study involves human participants, check with your IRB about consent and what you collect.
