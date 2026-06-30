import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const port = String(4300 + Math.floor(Math.random() * 400));
const server = spawn(process.execPath, ["server.js"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PORT: port },
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
  const data = await waitForServer();
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
  const sourceFiles = ["server.js", "public/app.js", "public/league-practice-room.tex"];
  const sourceOnlyBanned = [
    "Blunt read:",
    "Honest read:",
    "Improvement:",
    "Previous game read:",
    "Approx rank read:",
    "Reason:"
  ];
  const sourceOffenders = [];
  for (const file of sourceFiles) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    for (const label of sourceOnlyBanned) {
      if (source.includes(label)) sourceOffenders.push(`${file}: ${label}`);
    }
  }
  if (sourceOffenders.length) {
    throw new Error(`League source still contains visible role-prefix text:\n${sourceOffenders.join("\n")}`);
  }
  console.log("Samira generated copy has no role-prefix labels.");
} finally {
  server.kill();
}
