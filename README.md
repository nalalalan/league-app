# League

Single-page public review room for `league.aolabs.io`.

The page distills Alan's League practice arc into a calm AO Labs surface: pre-game review cards, situation rules, champion-fit cards, public notes, and a downloadable paper.

## Run Locally

```bash
npm start
```

Open `http://localhost:3000`.

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

## Deploy To GitHub Pages

The intended public domain is `league.aolabs.io`.

1. Commit changes on `main`.
2. Push to `nalalalan/league-app`.
3. Serve the `public/` folder on the `gh-pages` branch or configure Pages to publish the static files.
