import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const dataDir = await mkdtemp(join(tmpdir(), "league-samira-recovery-"));
const tipRoot = join(dataDir, "samira-tip-images");
const leaguePort = String(5100 + Math.floor(Math.random() * 250));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let providerCalls = 0;

const provider = createServer((_request, response) => {
  providerCalls += 1;
  if (providerCalls === 3) return;
  const content = JSON.stringify({
    relevant: true,
    transcript: "Visible Samira source text.",
    summary: "Wait for a real opening, preserve W, and leave after the payout.",
    tips: [
      "Wait for committed crowd control before E.",
      "Keep W for the named threat.",
      "Take the payout and reset."
    ]
  });
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ choices: [{ message: { content } }] }));
});

await new Promise((resolve, reject) => {
  provider.once("error", reject);
  provider.listen(0, "127.0.0.1", resolve);
});
const providerAddress = provider.address();
if (!providerAddress || typeof providerAddress === "string") throw new Error("Fake provider did not bind to a local port.");

async function makeRecord(index, analysisAttempts, activeAttemptToken) {
  const image = await sharp({
    create: {
      width: 180 + index,
      height: 100 + index,
      channels: 3,
      background: { r: 40 + index, g: 24, b: 24 }
    }
  }).png().toBuffer();
  const sha256 = createHash("sha256").update(image).digest("hex");
  const directory = join(tipRoot, sha256);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "original.png"), image);
  await writeFile(join(directory, "thumbnail.webp"), await sharp(image).webp().toBuffer());
  return {
    id: `samira-tip-${sha256.slice(0, 20)}`,
    sha256,
    format: "png",
    width: 180 + index,
    height: 100 + index,
    bytes: image.length,
    thumbnail_ready: true,
    created_at: new Date(Date.now() - index * 1000).toISOString(),
    status: "pending",
    analysis_attempts: analysisAttempts,
    manual_retries: Math.max(0, analysisAttempts - 1),
    active_attempt_token: activeAttemptToken,
    analysis_version: 1,
    relevance: "unknown",
    summary: "",
    transcript: "",
    tips: [],
    morning_eligible: false,
    last_error_code: ""
  };
}

const resumedAtLimit = await makeRecord(1, 3, "active-before-restart");
const queuedBeforeStart = await makeRecord(2, 2, "");
const strandedAtLimit = await makeRecord(3, 3, "");
const timedOutAttempt = await makeRecord(4, 1, "active-before-timeout");
await mkdir(tipRoot, { recursive: true });
await writeFile(join(tipRoot, "manifest.json"), JSON.stringify({
  version: 1,
  records: [resumedAtLimit, queuedBeforeStart, strandedAtLimit, timedOutAttempt],
  daily_uploads: { date: "2099-01-01", count: 4 }
}, null, 2));

const league = spawn(process.execPath, ["server.js"], {
  cwd: new URL("..", import.meta.url),
  env: {
    ...process.env,
    PORT: leaguePort,
    LEAGUE_DATA_DIR: dataDir,
    LEAGUE_DISABLE_AI: "0",
    LEAGUE_API_BUDGET_PAUSED: "0",
    OPENAI_API_KEY: "local-test-key",
    LEAGUE_ANALYSIS_TIMEOUT_MS: "1000",
    LEAGUE_OPENAI_URL: `http://127.0.0.1:${providerAddress.port}/v1/chat/completions`
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let leagueOutput = "";
league.stdout.on("data", (chunk) => { leagueOutput += String(chunk); });
league.stderr.on("data", (chunk) => { leagueOutput += String(chunk); });
const base = `http://127.0.0.1:${leaguePort}`;

try {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const health = await fetch(`${base}/api/health`);
      if (health.ok) break;
    } catch {
      // Wait for the local process.
    }
    if (attempt === 79) throw new Error(`Recovery server did not start.\n${leagueOutput}`);
    await sleep(100);
  }

  let records = [];
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const response = await fetch(`${base}/api/samira/tip-images`);
    const payload = await response.json();
    records = payload.tip_images || [];
    if (records.length === 4 && records.every((record) => record.status !== "pending")) break;
    await sleep(100);
  }

  const resumed = records.find((record) => record.id === resumedAtLimit.id);
  const queued = records.find((record) => record.id === queuedBeforeStart.id);
  const stranded = records.find((record) => record.id === strandedAtLimit.id);
  const timedOut = records.find((record) => record.id === timedOutAttempt.id);
  if (resumed?.status !== "ready" || resumed.analysis_attempts !== 3) {
    throw new Error(`Restart recovery consumed another counted attempt: ${JSON.stringify(resumed)}`);
  }
  if (queued?.status !== "ready" || queued.analysis_attempts !== 3) {
    throw new Error(`A pending but not-yet-started attempt was not counted exactly once: ${JSON.stringify(queued)}`);
  }
  if (stranded?.status !== "unavailable" || stranded.analysis_attempts !== 3 || stranded.can_retry !== false) {
    throw new Error(`A capped pending record remained stranded: ${JSON.stringify(stranded)}`);
  }
  if (timedOut?.status !== "unavailable" || timedOut.analysis_attempts !== 1 || timedOut.can_retry !== true) {
    throw new Error(`A stalled provider call did not time out into a retryable state: ${JSON.stringify(timedOut)}`);
  }
  if (providerCalls !== 3) throw new Error(`Recovery made ${providerCalls} provider calls instead of exactly 3.`);
  console.log("Samira recovery preserves retries, clears capped work, and bounds stalled provider calls.");
} finally {
  league.kill();
  await new Promise((resolve) => provider.close(resolve));
  await rm(dataDir, { recursive: true, force: true });
}
