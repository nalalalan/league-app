import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = String(4300 + Math.floor(Math.random() * 400));
const dataDir = await mkdtemp(join(tmpdir(), "league-samira-copy-"));
const server = spawn(process.execPath, ["server.js"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PORT: port, LEAGUE_DATA_DIR: dataDir },
  stdio: ["ignore", "pipe", "pipe"]
});

let output = "";
server.stdout.on("data", (chunk) => { output += String(chunk); });
server.stderr.on("data", (chunk) => { output += String(chunk); });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  const url = `http://127.0.0.1:${port}/api/samira`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (response.ok) return response.json();
    } catch {
      // Keep polling until the local server is ready.
    }
    await sleep(100);
  }
  throw new Error(`League server did not start on ${port}.\n${output}`);
}

function generatedSamiraStrings(data) {
  const strings = [
    data?.main_takeaway,
    data?.source_boundary,
    data?.rank_estimate?.reason,
    ...(Array.isArray(data?.tips) ? data.tips : [])
  ];
  for (const note of Array.isArray(data?.notes) ? data.notes : []) {
    strings.push(note?.description, note?.rank_read?.reason);
  }
  return strings.filter((value) => typeof value === "string" && value.trim());
}

try {
  await waitForServer();
  const sampleBodies = [
    [
      "Ranked solo queue loss. K/D/A 6/11/2. 174 CS. 21,209 damage. 12,004 gold. 412 gold/min.",
      "Alan's Samira game shows fixed flight pattern and boom-and-zoom.",
      "Edge is altitude. E is the dive. Return to edge is the climb.",
      "W ready, HP above half, ally close is the gate.",
      "The game got bad when I stayed in the middle after damage instead of leaving."
    ].join(" "),
    "Ranked solo queue. S loaded and S rank appeared, but R was only availability, not permission to R.",
    "Ranked solo queue. Fog chase turned into one more fight instead of wave, reset, or objective.",
    "Ranked solo queue. Teemo support, Pyke lane, 309/720 HP, 6/11/2. Make the bad lane smaller.",
    "Duo game with Lily. Use short commands, behind me, peel me, and calm commands before the fight.",
    "Ranked solo queue. Unspent gold and shutdown gold stayed on the map instead of buy, reset, wave, or objective.",
    "Ranked solo queue. W ready, HP above half, ally close is the green light before E."
  ];
  let saved = null;
  for (const sampleBody of sampleBodies) {
    const saveResponse = await fetch(`http://127.0.0.1:${port}/api/samira/notes`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ body: sampleBody })
    });
    if (!saveResponse.ok) {
      throw new Error(`Samira sample note did not save without token: ${saveResponse.status}`);
    }
    saved = await saveResponse.json();
  }
  const sampleNotes = sampleBodies.map((sampleBody) => saved?.samira?.notes?.find((note) => note?.body === sampleBody));
  if (sampleNotes.some((note) => !note)) throw new Error("Saved Samira sample notes were not all visible in /api/samira.");
  if (!Array.isArray(saved?.samira?.rank_trend?.points) || saved.samira.rank_trend.points.length < 2) {
    throw new Error("Samira API does not expose source-bound rank-over-time points.");
  }
  const sampleNote = sampleNotes[0];
  if (!/ranked solo/i.test(sampleNote.game_meta_line || "") || !/6\/11\/2/.test(sampleNote.game_meta_line || "") || !/174 CS/.test(sampleNote.game_meta_line || "")) {
    throw new Error(`Samira sample note did not expose game facts: ${sampleNote.game_meta_line || ""}`);
  }
  for (const note of sampleNotes) {
    const deleteResponse = await fetch(`http://127.0.0.1:${port}/api/samira/notes/${encodeURIComponent(note.id)}`, {
      method: "DELETE",
      headers: { Accept: "application/json" }
    });
    if (!deleteResponse.ok) {
      throw new Error(`Samira sample note did not delete without token: ${deleteResponse.status}`);
    }
  }
  const data = saved.samira;
  const bannedLabels = [
    "Good sign",
    "Biggest watchout",
    "Best move",
    "Recommendation",
    "Why it helps",
    "Main concern",
    "Action",
    "Reason",
    "Next",
    "Blunt read",
    "Honest read",
    "Improvement",
    "Previous game read",
    "Approx rank read"
  ];
  const banned = new RegExp(`(?:${bannedLabels.join("|")})\\s*:`, "i");
  const offending = generatedSamiraStrings(data).filter((text) => banned.test(text));
  if (offending.length) {
    throw new Error(`Generated Samira copy contains role-prefix text:\n${offending.join("\n")}`);
  }
  const bannedCounterCopy = /\b\d+\s+(?:value-conversion|payout|leak|green-light)\s+(?:signals?|checks?)\b|\b(?:value-conversion|payout|leak|green-light)\s+signals?\b/i;
  const counterOffending = generatedSamiraStrings(data).filter((text) => bannedCounterCopy.test(text));
  if (counterOffending.length) {
    throw new Error(`Generated Samira copy contains useless signal counters:\n${counterOffending.join("\n")}`);
  }
  const bannedTemplateCopy = /\bThe valuable part is\b|\bMean version\b|\bPrevious game punished\b|\bBronze\s+[IVX]+\s+read\b|\bIron\s+[IVX]+\s+read\b/i;
  const templateOffending = generatedSamiraStrings(data).filter((text) => bannedTemplateCopy.test(text));
  if (templateOffending.length) {
    throw new Error(`Generated Samira copy is still template-like:\n${templateOffending.join("\n")}`);
  }
  const repetitiveFallbackCopy = /\bTurn the note into one pressable habit\b|\bBefore queueing, turn the note\b|\bThe old leak was red-light E\b/i;
  const repetitiveOffending = generatedSamiraStrings(data).filter((text) => repetitiveFallbackCopy.test(text));
  if (repetitiveOffending.length) {
    throw new Error(`Generated Samira copy still uses repeated fallback prose:\n${repetitiveOffending.join("\n")}`);
  }
  const bannedPrefaceCopy = /\bThe\s+(?:improvement|note|duo lesson|money leak|entry rule|death|lesson|leak|rule)\s+(?:is|was)\b|\bThe map payout has to\b|\bThis is an ugly-lane note\b/i;
  const prefaceOffending = generatedSamiraStrings(data).filter((text) => bannedPrefaceCopy.test(text));
  if (prefaceOffending.length) {
    throw new Error(`Generated Samira copy still uses assistant preface stems:\n${prefaceOffending.join("\n")}`);
  }
  const sourceFiles = ["server.js", "public/league-practice-room.tex"];
  const sourceOnlyBanned = [
    "Blunt read:",
    "Honest read:",
    "Previous game read:",
    "Approx rank read:",
    "value-conversion signals",
    "payout signals",
    "leak signals",
    "green-light signals",
    "green-light checks",
    "The improvement is naming",
    "The improvement is separating",
    "The improvement is seeing",
    "The improvement is giving",
    "The improvement is shrinking",
    "The improvement is making"
  ];
  const sourceOffenders = [];
  for (const file of sourceFiles) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    const lowerSource = source.toLowerCase();
    for (const label of sourceOnlyBanned) {
      if (lowerSource.includes(label.toLowerCase())) sourceOffenders.push(`${file}: ${label}`);
    }
  }
  if (sourceOffenders.length) {
    throw new Error(`League source still contains visible role-prefix text:\n${sourceOffenders.join("\n")}`);
  }
  const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  if (!/function\s+directVisibleCopy\s*\(/.test(appSource) || !/descriptionText\.textContent\s*=\s*directVisibleCopy\(description\)/.test(appSource)) {
    throw new Error("Samira note-card descriptions do not pass through the direct visible-copy sanitizer.");
  }
  const styles = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  if (!/\.samira-note-form\s*\{[\s\S]*?max-width:\s*390px;/.test(styles)) {
    throw new Error("Samira note composer is not capped independently from the saved-note grid.");
  }
  if (!/<textarea[^>]+id="samira-note-body"[^>]+rows="1"/.test(html) || !/\.samira-note-form textarea\s*\{[\s\S]*?height:\s*38px;[\s\S]*?overflow:\s*auto;/.test(styles)) {
    throw new Error("Samira note composer is not a compact one-row scrolling paste box.");
  }
  if (!/\.samira-note-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(min\(100%,\s*320px\),\s*1fr\)\);/.test(styles)) {
    throw new Error("Samira saved-note grid is no longer wide enough to avoid skinny text towers.");
  }
  if (!/\.samira-intake\s*\{[\s\S]*?grid-template-columns:\s*minmax\(280px,\s*390px\)\s+minmax\(0,\s*1fr\);[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;/.test(styles)) {
    throw new Error("Samira intake still uses a big enclosing card instead of a compact work layout.");
  }
  if (!/id="samira-rank-trend"/.test(html) || !/\.samira-rank-trend\s*\{[\s\S]*?grid-column:\s*2;[\s\S]*?grid-row:\s*2;/.test(styles)) {
    throw new Error("Samira rank-over-time chart is missing from the compact intake header.");
  }
  if (!/\.samira-main-takeaway\s*\{[\s\S]*?align-self:\s*stretch;[\s\S]*?min-height:\s*0;/.test(styles) || /\.samira-main-takeaway\s*\{[\s\S]*?grid-row:\s*1\s*\/\s*span\s*2;/.test(styles)) {
    throw new Error("Samira current read is stretched across the heading/composer block.");
  }
  if (!/\.samira-main-takeaway\s*\{[\s\S]*?font-size:\s*clamp\(18px,\s*1\.25vw,\s*22px\);/.test(styles)) {
    throw new Error("Samira current read is not scaled as the primary read.");
  }
  if (!/function\s+renderSamiraRankTrend\s*\(/.test(appSource) || !/rankTrendSvg\(points,\s*\{\s*compact:\s*true\s*\}\)/.test(appSource)) {
    throw new Error("Samira rank chart is not rendered from the source-bound rank trend.");
  }
  if (!/@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?\.samira-intake\s*\{[\s\S]*?grid-template-columns:\s*1fr;/.test(styles)) {
    throw new Error("Samira intake does not collapse before the chart lane becomes cramped.");
  }
  if (!/\.samira-pdf-main\s*\{[\s\S]*?grid-template-rows:\s*auto\s+auto\s+auto;/.test(styles)) {
    throw new Error("Samira note cards still stretch short notes into empty towers.");
  }
  if (!/@media\s*\(max-width:\s*820px\)\s*\{[\s\S]*?\.paper-strip-compact\s*\{[\s\S]*?display:\s*flex;/.test(styles)) {
    throw new Error("Samira mobile paper strip still uses a stacked layout.");
  }
  console.log("Samira generated copy has no role-prefix labels, useless signal counters, or template card prose.");
} finally {
  server.kill();
  await rm(dataDir, { recursive: true, force: true });
}
