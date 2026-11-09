# Short-video feed simulator (final version)

## What's in this folder

| File | What it does |
|---|---|
| `index.html`, `app.js`, `styles.css` | The app |
| `content-loader.js`, `xlsx.mini.min.js` | Read the spreadsheet |
| `logger.js` | Records viewing behavior and sends it to Supabase |
| `config.js` | **All settings** (spreadsheet name, video folder, Supabase keys…) |
| `content_110927.xlsx` | The videos, captions and play order |
| `supabase/schema.sql` | Database setup (run once in Supabase's SQL Editor) |

The videos go in a folder named **`studyvids_11092026`**, next to `index.html`.

## Setup checklist

1. **Upload** everything in this folder, plus the `studyvids_11092026` folder of videos, to `tiktok-sim-d2` in your GitHub repository, replacing the old files. GitHub Desktop is easiest (Repository → Show in Finder, copy the files in, then Commit and Push).
2. **Supabase:** in `config.js`, fill in `supabase.url` and `supabase.anonKey`. Without them, no data is saved.
3. **Check:** open `https://the-change-lab.github.io/burks_mediasim_app/?debug=1&pid=test1`. The debug panel should say `backend: ok` and the videos should play.
4. **Qualtrics link:** `https://the-change-lab.github.io/burks_mediasim_app/?pid=${e://Field/ResponseID}` (set to open in a new window).

## Changing things later

- **Different spreadsheet or video folder:** change `contentFile` or `videoFolder` in `config.js`. Names must match exactly, including capitals.
- **Which videos play, and their order:** edit `show_in_feed` and the row order in the spreadsheet (`feedOrder: "fixed"` plays rows top to bottom).
- **Spreadsheet edited in Google Sheets:** choose **File → Download → Microsoft Excel (.xlsx)**, rename it to match `contentFile`, and upload it.
- **File names:** if a file isn't found, the app automatically tries `.mp4`, `.MP4`, `.mov` and `.MOV` versions of the name. MP4s still play most reliably.

## What gets recorded

One row per event (in the Supabase `events` table): video views with watch time, pauses, replays, holds at 2× speed, caption opens, swipes, likes, blocked page taps, and loading stalls. Summary per video view: the `video_views` view.
