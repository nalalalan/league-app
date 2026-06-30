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
  const sampleBody = [
    "Ranked solo queue loss. K/D/A 6/11/2. 174 CS. 21,209 damage. 12,004 gold. 412 gold/min.",
    "Alan's Samira game shows fixed flight pattern and boom-and-zoom.",
    "Edge is altitude. E is the dive. Return to edge is the climb.",
    "W ready, HP above half, ally close is the gate.",
    "The game got bad when I stayed in the middle after damage instead of leaving."
  ].join(" ");
  const saveResponse = await fetch(`http://127.0.0.1:${port}/api/samira/notes`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ body: sampleBody })
  });
  if (!saveResponse.ok) {
    throw new Error(`Samira sample note did not save without token: ${saveResponse.status}`);
  }
  const saved = await saveResponse.json();
  const sampleNote = saved?.samira?.notes?.find((note) => note?.body === sampleBody);
  if (!sampleNote) throw new Error("Saved Samira sample note was not visible in /api/samira.");
  if (!/ranked solo/i.test(sampleNote.game_meta_line || "") || !/6\/11\/2/.test(sampleNote.game_meta_line || "") || !/174 CS/.test(sampleNote.game_meta_line || "")) {
    throw new Error(`Samira sample note did not expose game facts: ${sampleNote.game_meta_line || ""}`);
  }
  const deleteResponse = await fetch(`http://127.0.0.1:${port}/api/samira/notes/${encodeURIComponent(sampleNote.id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });
  if (!deleteResponse.ok) {
    throw new Error(`Samira sample note did not delete without token: ${deleteResponse.status}`);
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
  const sourceFiles = ["server.js", "public/app.js", "public/league-practice-room.tex"];
  const sourceOnlyBanned = [
    "Blunt read:",
    "Honest read:",
    "Previous game read:",
    "Approx rank read:",
    "value-conversion signals",
    "payout signals",
    "leak signals",
    "green-light signals",
    "green-light checks"
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
  console.log("Samira generated copy has no role-prefix labels, useless signal counters, or template card prose.");
} finally {
  server.kill();
  await rm(dataDir, { recursive: true, force: true });
}
