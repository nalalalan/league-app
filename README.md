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

The live recorder is intended to run without Codex in the loop. It watches for the League game process, captures the League game window by title so normal alt-tabbing does not remove large parts of the match, writes a sidecar next to each auto clip, rejects incomplete or DPI-cropped captures before publish, then lets the publisher sync and deploy the recording. Region capture remains available as an explicit fallback and pauses instead of recording browser/desktop content. Offline checks handle capture validity and media prep; OpenAI is used only for the coaching narrative after the clip passes those checks.

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
