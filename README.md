# League

Single-page public review room for `league.aolabs.io`.

The page distills Alan's League practice arc into a calm AO Labs surface: pre-game review cards, situation rules, champion-fit cards, public notes, and a downloadable paper.

## Run Locally

```bash
npm start
```

Open `http://localhost:3000`.

## Runtime

- `GET /api/health` reports app, storage, and AI readiness without exposing secrets.
- `GET /api/logs` returns public notes.
- `POST /api/logs` appends a public note. In Railway, set `LEAGUE_WRITE_TOKEN` before enabling writes.
- `LEAGUE_DATA_DIR` or `RAILWAY_VOLUME_MOUNT_PATH` controls persistent note storage.

## Recordings

New League `.webm` recordings are synced from:

```bash
C:\Users\phama\Documents\League of Legends\Highlights
```

Run:

```bash
npm run sync:recordings
```

The sync copies small recordings into `public/recordings/`, compresses large recordings into deployable `.mp4` files, extracts poster frames, and writes `public/recordings/recordings.json`. The page loads that manifest so new recordings can appear without editing `app.js`.

Recording order is source-modified-time order. The sync preserves that order for analysis, but the public page stays focused on one queue plan plus one feedback item per recording. Each feedback item carries a `whyTrust` rationale plus a collapsed full read with pattern, Diamond rule, queue rep, visible evidence, nuance, and review limit.

Run:

```bash
npm run publish:recordings
```

The publish command skips work when the source folder has not changed. When new recordings exist, it syncs them, commits `public/recordings`, pushes `main`, and starts a Railway deploy. Cached fallback notes are kept during normal automatic publishes so old clips do not slow down the post-game update; set `LEAGUE_RETRY_FALLBACK=1` for an explicit retry pass.

The live recorder is intended to run without Codex in the loop. It watches for the League game process and the local League Client gameflow state, captures the League window region at low priority at 2 FPS by default, writes a sidecar next to each auto clip, rejects incomplete, black-screen, or broken captures before publish, then lets the queued publisher analyze, sync, verify, and deploy one post-game review at a time while the next game can continue recording. The first 12 minutes can be captured at 8 FPS by default through `LEAGUE_EARLY_MICRO_FPS` / `LEAGUE_EARLY_MICRO_SECONDS`; that bounded early-lane window feeds a separate micro pass for lane spacing, support/body line, CC timing, auto/Q/W/E evidence, and all-in legality while the normal whole-game macro review stays cheap and low-lag. If the recorder restarts mid-game, it ignores that partial game and waits for the next full one. Offline checks handle capture validity and media prep; low-motion captures are allowed to be small as long as the segments are real video. OpenAI is used only for the coaching narrative after the clip passes those checks.

The site exposes a compact recorder heartbeat at `/api/recording-status`. The local recorder and publisher post `watching`, `recording`, `processing`, `publishing`, `published`, `blocked`, or `error`, plus queue rows, per-stage ETAs, ready-time estimates, and a coarse progress value, so the recordings header can show whether a game is being captured, waiting, analyzed, deployed, or live before the final review appears. Long sync/analysis steps keep posting heartbeats so a normal post-game publish does not look stale. Automatic captures with a recorder sidecar are accepted when the sidecar proves enough real segment coverage.

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
