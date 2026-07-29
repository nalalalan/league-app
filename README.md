# League

Single-page public Samira practice record for `league.aolabs.io`.

The page has two intentionally separate source paths:

- `samira tips` accepts public PNG, JPEG, and WebP screenshots, preserves the exact original, and extracts source-grounded tips with stable IDs for review and morning-email rotation.
- `coach game analyses` copies one complete VOD-review message, receives the coach's finished response, and preserves that response as the primary source for a structured game entry, note PDF, approximate rank read, notes-only rank trend, and separate CS@10 trend.

Screenshot tips never become game facts, rank points, CS points, or coach-entry PDFs. Coach videos stay in the user's existing external coach channel; this app copies the request but does not upload or send the video. The rank read comes from explicit rank phrases first, then parsed final Alan/Samira-owned facts and note language, not from CS@10, screenshot tips, model guesses, champion names, or recording archive points.

## Coach Workflow

1. Press `copy coach message`.
2. Paste it beside the recorded game in the existing coach conversation.
3. Paste the coach's completed response into `paste your coach's completed analysis`.
4. Save the analysis.

The raw coach response is stored before any generated structuring. A failed extraction cannot lose or roll back the saved analysis. The structured derivative groups game facts, scoreboard values, rank evidence, timeline decisions, lane, mechanics, fights, macro/resources, vision, mental/communication patterns, development priorities, drills, and explicit uncertainties. Each derived claim is labeled as coach-stated, grounded derivative, or not visible.

The copy control reads canonical hidden writing artifact `48317` as one trimmed plain-text paragraph. The long message is not displayed unless clipboard access fails, when an accessible read-only fallback dialog makes the same paragraph selectable without touching unsaved coach text.

## Screenshot Tips

The image intake supports paste, drag/drop, and file selection. Each client action accepts up to five images, sent as one raw-image request each. The backend validates the declared type, magic bytes, complete decode, 10 MiB limit, 25-megapixel limit, and static-image boundary. It deduplicates by the original SHA-256, stores originals outside the coach-note corpus, and uses bounded analysis attempts. Irrelevant or unreadable screenshots remain source records but do not enter the morning-tip pool.

## Run Locally

```bash
npm start
```

Open `http://localhost:3000`.

## Runtime

- `GET /api/health` reports app, storage, coach-entry, and screenshot-analysis readiness without exposing secrets.
- `GET /api/samira` retains the compatible aggregate note/rank/chart read.
- `POST /api/samira/notes` stores a complete public coach response before generated extraction.
- `GET /api/samira/notes/:id` returns the complete structured coach game entry and preserved source.
- `GET /api/samira/notes/:id.pdf` returns the public game-entry PDF.
- `POST /api/samira/tip-images` accepts one raw public PNG, JPEG, or WebP body.
- `GET /api/samira/tip-images` lists compact public screenshot records.
- `GET /api/samira/tip-images/:id` returns one screenshot's full transcript, summary, and tips.
- `GET /api/samira/tip-images/:id/original` returns the exact accepted source bytes.
- `GET /api/samira/tip-images/:id/thumbnail` returns its display derivative.
- `POST /api/samira/tip-images/:id/retry` retries an eligible unavailable analysis within the lifetime attempt cap.
- `DELETE /api/samira/tip-images/:id` publicly deletes the record and its source files.
- `GET /api/samira/tips` returns eligible stable-ID tips for the morning email.
- `GET /api/logs` returns public notes; `POST /api/logs` retains the existing write-token boundary.
- `LEAGUE_DATA_DIR` or `RAILWAY_VOLUME_MOUNT_PATH` controls persistent note, coach-entry, and screenshot storage.

Coach-note save/delete and screenshot add/retry/delete are deliberately password-free public operations. Upload/retry requests are bounded per IP and globally; deletes are bounded per IP; the screenshot library has a 200-record cap and no automatic eviction. Do not paste credentials, private third-party identifiers, or other material that should not be public.

## Morning Samira Tips

The morning automation reads only `GET /api/samira/tips`. It sends three plain bullets when three distinct eligible stable IDs exist, otherwise two. It prefers screenshot tips not used in the previous seven successfully delivered and raw-MIME-verified emails, then least-recently sent image tips. When fewer than two image tips exist, the endpoint's coach-entry next-game rules/priorities and legacy League tips fill the remaining slots. Email generation performs no OCR or gameplay-generation call, and selection history advances only after Gmail send plus stored raw-MIME readback.

## Recordings

New League `.webm` recordings are synced from:

```bash
C:\Users\phama\Documents\League of Legends\Highlights
```

Run:

```bash
npm run sync:recordings
```

The sync copies small recordings into `public/recordings/`, compresses large recordings into deployable `.mp4` files, extracts poster frames, and writes `public/recordings/recordings.json`. The home page does not load that manifest by default; recordings remain a backend/archive source for the Samira read, paper, and future review work.

Recording order is source-modified-time order. The sync preserves that order for analysis, but the public page stays focused on one queue plan plus one feedback item per recording. Each feedback item carries a `whyTrust` rationale plus a collapsed full read with pattern, Diamond rule, queue rep, visible evidence, nuance, and review limit.

Run:

```bash
npm run publish:recordings
```

The publish command skips work when the source folder has not changed. When new recordings exist, it syncs them, commits `public/recordings`, pushes `main`, and starts a Railway deploy. Cached fallback notes are kept during normal automatic publishes so old clips do not slow down the post-game update; set `LEAGUE_RETRY_FALLBACK=1` for an explicit retry pass.

The live recorder is intended to run without Codex in the loop. It watches for the League game process and the local League Client gameflow state, captures the League window region at low priority at 2 FPS by default, writes a sidecar next to each auto clip, rejects incomplete, black-screen, or broken captures before publish, then lets the queued publisher analyze, sync, verify, and deploy one post-game review at a time while the next game can continue recording. The first 12 minutes can be captured at 8 FPS by default through `LEAGUE_EARLY_MICRO_FPS` / `LEAGUE_EARLY_MICRO_SECONDS`; that bounded early-lane window feeds a separate micro pass for lane spacing, support/body line, CC timing, auto/Q/W/E evidence, all-in legality, and the Samira lane drill `auto/Q - back click - re-check` while the normal whole-game review stays cheap and low-lag. Future visible reviews now render as a two-column mistake table only: `Time` and `Mistake`, five rows max, with no rank explanation or paragraph. Samira reviews still audit green-light discipline first: E toward champions is allowed only when W is ready, HP is above half, and an ally is on screen or close enough; otherwise the row marks red light, names the failed condition or uncertain condition, names the wrong E/forward input, and gives the correct Q/auto-back, kite, farm, or wait input. The Samira intake stores long pasted notes beside those recording reads and exposes a source-bounded rank estimate for practice review, not Riot MMR. If the recorder restarts mid-game, it ignores that partial game and waits for the next full one. Offline checks handle capture validity and media prep; low-motion captures are allowed to be small as long as the segments are real video. OpenAI is used only after the clip passes those checks.

The site exposes a compact recorder heartbeat at `/api/recording-status`. The local recorder and publisher post `watching`, `recording`, `processing`, `publishing`, `published`, `blocked`, or `error`, plus queue rows, per-stage ETAs, ready-time estimates, and a coarse progress value, so the recordings header can show whether a game is being captured, waiting, analyzed, deployed, or live before the final review appears. Long sync/analysis steps keep posting heartbeats so a normal post-game publish does not look stale. Automatic captures with a recorder sidecar are accepted when the sidecar proves enough real segment coverage.

Budget guardrails: set `LEAGUE_API_BUDGET_PAUSED=1` to stop scheduled/automatic AI publish before analysis, or set `LEAGUE_POST_GAME_QUEUE_PAUSED=1` to keep capture status visible while stopping only automatic post-game AI review. Automatic feedback retries are capped by `LEAGUE_MAX_FEEDBACK_RETRIES` and default to `3`; clips that hit the cap move to `_recording-analysis/post-game-paused-queue.json` instead of retrying indefinitely.

Run:

```bash
npm run verify:league-automation
```

The verification checks the local recorder process, hidden Startup launcher, local status token, scheduled publisher, fresh local/live recorder status, live manifest, and latest live video route. It fails loudly if the next automatic game is unlikely to publish without Codex.

## Paper

The public paper artifacts are:

- `public/league-practice-room.tex`
- `public/league-practice-room.pdf`

Compile from `public/` with:

```bash
pdflatex league-practice-room.tex
biber league-practice-room
pdflatex league-practice-room.tex
pdflatex league-practice-room.tex
```

## Deploy

The intended public domain is `league.aolabs.io`.

Deploy with Railway for server-side storage and future AI routes.
