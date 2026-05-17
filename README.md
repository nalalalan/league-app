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
