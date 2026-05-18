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

The sync copies recordings into `public/recordings/`, extracts poster frames, and writes `public/recordings/recordings.json`. The page loads that manifest so new recordings can appear without editing `app.js`.

Recording order is source-modified-time order. The sync preserves that order for analysis, but the public page stays focused on one queue plan plus one feedback item per recording. Each generated feedback item also carries a `whyTrust` rationale so the page explains why the rule is worth trying.

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
