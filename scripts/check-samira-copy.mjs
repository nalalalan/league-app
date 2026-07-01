import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = String(4300 + Math.floor(Math.random() * 400));
const dataDir = await mkdtemp(join(tmpdir(), "league-samira-copy-"));
const server = spawn(process.execPath, ["server.js"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PORT: port, LEAGUE_DATA_DIR: dataDir, LEAGUE_DISABLE_AI: "1" },
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
      "Normal Swiftplay Victory. Team 1 won 42/23/55 with 98,163 gold against Team 2's 23/42/29 with 84,823 gold.",
      "Alan's Samira finished 16/6/5, 40,565 damage, 22,994 gold, and 923 gold/min.",
      "Don't drop Samira’s punctuation; Lily’s climb-out sentence should stay readable.",
      "At 24:02 Alan was 12/6/5 with 172 CS and 2,904 gold, then the final fight moved him to 16/6/5.",
      "The useful Samira rule is still edge, dive, damage, climb out, then buy or reset."
    ].join(" "),
    [
      "Ranked solo queue loss. K/D/A 6/11/2. 174 CS. 21,209 damage. 12,004 gold. 412 gold/min.",
      "Alan's Samira game shows fixed flight pattern and boom-and-zoom.",
      "Edge is altitude. E is the dive. Return to edge is the climb.",
      "W ready, HP above half, ally close is the gate.",
      "The game got bad when I stayed in the middle after damage instead of leaving."
    ].join(" "),
    [
      "Swiftplay loss. K/D/A 2/0/0. 15 CS. 4,492 gold.",
      "Alan was the win condition but kept treating the defense like one more chance to stand in the middle.",
      "The useful model is still boom-and-zoom, but the actual leak was defending panic after value."
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
  const june30Start = Date.parse("2026-06-30T00:00:00-04:00");
  if (saved.samira.rank_trend.points.some((point) => Number(point.time_ms) < june30Start)) {
    throw new Error("Samira rank trend includes notes or recordings before June 30.");
  }
  const sampleNote = sampleNotes[0];
  if (!/Swiftplay/i.test(sampleNote.game_meta_line || "") || !/16\/6\/5/.test(sampleNote.game_meta_line || "") || !/172 CS/.test(sampleNote.game_meta_line || "") || !/40,565 damage/.test(sampleNote.game_meta_line || "") || !/22,994 gold/.test(sampleNote.game_meta_line || "")) {
    throw new Error(`Samira team-score sample did not expose Alan/Samira facts: ${sampleNote.game_meta_line || ""}`);
  }
  if (/42\/23\/55|98,163 gold/.test(sampleNote.game_meta_line || "")) {
    throw new Error(`Samira team-score sample leaked team stats into card metadata: ${sampleNote.game_meta_line || ""}`);
  }
  const pdfResponse = await fetch(`http://127.0.0.1:${port}${sampleNote.pdf_url}`, {
    headers: { Accept: "application/pdf" }
  });
  if (!pdfResponse.ok) {
    throw new Error(`Samira note PDF did not render: ${pdfResponse.status}`);
  }
  const pdfBody = Buffer.from(await pdfResponse.arrayBuffer()).toString("latin1");
  if (!pdfBody.includes("Alan's Samira") || !pdfBody.includes("Don't drop Samira\x92s punctuation") || !pdfBody.includes("Lily\x92s climb-out")) {
    throw new Error("Samira note PDF does not preserve apostrophe punctuation in existing note text.");
  }
  if (/Alan s Samira|Don t drop|Samira s punctuation|Lily s climb-out/.test(pdfBody)) {
    throw new Error("Samira note PDF still converts apostrophes into gaps.");
  }
  if (!/\b\d+(?:\.\d+)? Tw\b/.test(pdfBody)) {
    throw new Error("Samira note PDF paragraphs are not using justified word spacing.");
  }
  const rankedSampleNote = sampleNotes[1];
  if (!/ranked solo/i.test(rankedSampleNote.game_meta_line || "") || !/6\/11\/2/.test(rankedSampleNote.game_meta_line || "") || !/174 CS/.test(rankedSampleNote.game_meta_line || "")) {
    throw new Error(`Samira sample note did not expose game facts: ${rankedSampleNote.game_meta_line || ""}`);
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
  const descriptions = (Array.isArray(data?.notes) ? data.notes : [])
    .map((note) => String(note?.description || "").replace(/\s+/g, " ").trim().toLowerCase())
    .filter(Boolean);
  const repeatedDescriptions = descriptions.filter((description, index) => descriptions.indexOf(description) !== index);
  if (repeatedDescriptions.length) {
    throw new Error(`Generated Samira copy reused the same description across different notes:\n${repeatedDescriptions.join("\n")}`);
  }
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
  const roboticSummaryCopy = /\b(?:remember:|The note (?:clearly )?(?:defines|identifies|emphasizes|highlights)|highlighting that|aligns with|your main failure|main failure|biggest failure|main mistake|biggest mistake|classic .* (?:mistake|behavior)|at this level|you understand|you know the entry and payout|mental overload|poor fight endings|mechanical and decision flaws?|fundamental .* flaws?|ranked-habit evidence|limited ranked|beyond baseline|source-bounded note analysis|must adopt|must be|playstyle|approach|clear entry|exit patterns?|failure to|ranked-level|decision depth|basic fight timing|opportunit(?:y|ies)|show enough|climb yet|red flags?|avoid(?:s|ing)?)\b/i;
  const roboticOffending = generatedSamiraStrings(data).filter((text) => roboticSummaryCopy.test(text));
  if (roboticOffending.length) {
    throw new Error(`Generated Samira copy still sounds like a robotic summary:\n${roboticOffending.join("\n")}`);
  }
  const cutoffOffending = generatedSamiraStrings(data)
    .filter((text) => text.length > 24 && !/[.!?]$/.test(text) && !/^(?:Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Master|Grandmaster|Challenger)\b/.test(text));
  if (cutoffOffending.length) {
    throw new Error(`Generated Samira copy looks cut off:\n${cutoffOffending.join("\n")}`);
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
  if (!/id="samira-rank-trend"/.test(html) || !/\.samira-rank-trend\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1;[\s\S]*?grid-row:\s*3;/.test(styles)) {
    throw new Error("Samira rank-over-time chart is not filling the full intake row.");
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
  if (!/\.samira-rank-trend svg\s*\{[\s\S]*?height:\s*clamp\(180px,\s*14vw,\s*220px\);/.test(styles)) {
    throw new Error("Samira rank chart is not large enough to carry the current-read row.");
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
