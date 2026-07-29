import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dataDir = await mkdtemp(join(tmpdir(), "league-samira-coach-ai-"));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let providerCalls = 0;

const provider = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  providerCalls += 1;
  const content = JSON.stringify({
    timeline: [{
      video_timestamp: "06:18",
      game_clock: "05:50",
      phase: "lane",
      category: "recall",
      decision_type: "strength",
      visible_state: "The wave was pushed into tower.",
      available_information: "The lane opponents were visible.",
      apparent_plan: "Recall on the crash.",
      action: "Alan recalled.",
      evaluation: "Correct.",
      consequence: "Returned without losing the next wave.",
      severity: "low",
      better_action: "Keep this exact recall timing.",
      expected_result: "Preserve tempo.",
      replacement_rule: "Crash, then recall.",
      source_status: "grounded-derivative"
    }],
    domains: {},
    development: {},
    uncertainties: []
  });
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ choices: [{ message: { content } }] }));
});

await new Promise((resolve, reject) => {
  provider.once("error", reject);
  provider.listen(0, "127.0.0.1", resolve);
});
const providerAddress = provider.address();
if (!providerAddress || typeof providerAddress === "string") throw new Error("Fake coach provider did not bind.");

let league = null;
let leagueOutput = "";

function startLeague(port) {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      PORT: String(port),
      LEAGUE_DATA_DIR: dataDir,
      LEAGUE_DISABLE_AI: "0",
      LEAGUE_API_BUDGET_PAUSED: "0",
      OPENAI_API_KEY: "local-test-key",
      LEAGUE_OPENAI_URL: `http://127.0.0.1:${providerAddress.port}/v1/chat/completions`,
      LEAGUE_ANALYSIS_TIMEOUT_MS: "2000"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", (chunk) => { leagueOutput += String(chunk); });
  child.stderr.on("data", (chunk) => { leagueOutput += String(chunk); });
  return child;
}

async function waitForServer(base) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {
      // Wait for the local process.
    }
    await sleep(100);
  }
  throw new Error(`Coach AI test server did not start.\n${leagueOutput}`);
}

async function stopLeague() {
  if (!league || league.exitCode !== null) return;
  league.kill();
  await once(league, "exit");
}

try {
  const firstPort = 5400 + Math.floor(Math.random() * 150);
  let base = `http://127.0.0.1:${firstPort}`;
  league = startLeague(firstPort);
  await waitForServer(base);

  const body = [
    "Game date/time: July 28, 2026 8:15 PM ET.",
    "Game type/result: Ranked Solo Victory.",
    "Game duration: 29:44.",
    "Final visible scoreboard: Alan's Samira finished 11/4/9, 221 CS, 34220 damage, 18440 gold, and 620 gold/min.",
    "CS@10: 74.",
    "Gameplay-estimated rank for Alan's Samira performance: Gold II.",
    "Chronological timeline:",
    "Video 06:18 / game 05:50: Alan crashed the wave and recalled correctly.",
    "Video 21:04 / game 20:36: Alan used E before the enemy stun and died.",
    "Mechanics and execution: Q weaving was consistent."
  ].join("\n");

  const saveResponse = await fetch(`${base}/api/samira/notes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body })
  });
  const save = await saveResponse.json();
  if (saveResponse.status !== 201 || save.analysis_status !== "pending" || !save.note?.id) {
    throw new Error(`AI-ready coach save did not expose its real queued state: ${JSON.stringify(save)}`);
  }

  let detail = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const response = await fetch(`${base}/api/samira/notes/${encodeURIComponent(save.note.id)}`);
    detail = await response.json();
    if (detail.coach_entry?.analysis_status === "ready") break;
    await sleep(100);
  }
  const timeline = detail?.coach_entry?.timeline || [];
  const first = timeline.find((item) => item.video_timestamp === "06:18");
  const second = timeline.find((item) => item.video_timestamp === "21:04");
  if (timeline.length !== 2 || !first || !second || first.better_action !== "Keep this exact recall timing.") {
    throw new Error(`A partial AI timeline erased or failed to enrich deterministic source events: ${JSON.stringify(timeline)}`);
  }
  if (first.source_status !== "grounded-derivative" || providerCalls !== 1) {
    throw new Error(`Timeline provenance/provider count is wrong: ${first.source_status} / ${providerCalls}`);
  }

  await stopLeague();
  const cachePath = join(dataDir, "samira-coach-entry-cache.json");
  const cache = JSON.parse(await readFile(cachePath, "utf8"));
  cache.entries[save.note.id].analysis_status = "pending";
  cache.entries[save.note.id].analysis_attempted = true;
  await writeFile(cachePath, JSON.stringify(cache, null, 2));

  const secondPort = firstPort + 200;
  base = `http://127.0.0.1:${secondPort}`;
  league = startLeague(secondPort);
  await waitForServer(base);
  let recovered = null;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(`${base}/api/samira/notes/${encodeURIComponent(save.note.id)}`);
    recovered = await response.json();
    if (recovered.coach_entry?.analysis_status === "unavailable") break;
    await sleep(100);
  }
  if (recovered?.coach_entry?.analysis_status !== "unavailable" || providerCalls !== 1) {
    throw new Error(`Restarted coach extraction stayed pending or retried automatically: ${JSON.stringify({ status: recovered?.coach_entry?.analysis_status, providerCalls })}`);
  }
  console.log("Samira coach extraction merges partial timelines and normalizes crash-pending cache state without retry loops.");
} finally {
  await stopLeague().catch(() => {});
  await new Promise((resolve) => provider.close(resolve));
  await rm(dataDir, { recursive: true, force: true });
}
