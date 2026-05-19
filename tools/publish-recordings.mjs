import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const analysisRoot = path.join(appRoot, "_recording-analysis");
const statePath = path.join(analysisRoot, "source-state.json");
const sourceDir = process.env.LEAGUE_RECORDINGS_DIR || "C:\\Users\\phama\\Documents\\League of Legends\\Highlights";
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
const railwayBin = process.platform === "win32" ? "railway.cmd" : "railway";
const sourceVideoPattern = /\.(webm|mp4)$/i;
const publishPaths = [
  "public/recordings",
  "public/app.js",
  "public/index.html",
  "public/styles.css",
  "public/league-practice-room.pdf",
  "public/league-practice-room.tex",
  "tools/sync-recordings.mjs",
  "tools/publish-recordings.mjs"
];

function commandNeedsShell(command) {
  return process.platform === "win32" && /\.cmd$/i.test(command);
}

async function run(command, args, options = {}) {
  const result = await execFileAsync(command, args, {
    cwd: appRoot,
    maxBuffer: 64 * 1024 * 1024,
    shell: commandNeedsShell(command),
    windowsHide: true,
    ...options
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

async function sourceState() {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile() || !sourceVideoPattern.test(entry.name)) continue;
    const absolute = path.join(sourceDir, entry.name);
    const stat = await fs.stat(absolute);
    files.push({
      name: entry.name,
      size: stat.size,
      mtimeMs: Math.round(stat.mtimeMs)
    });
  }
  files.sort((a, b) => a.mtimeMs - b.mtimeMs || a.name.localeCompare(b.name));
  return {
    version: 1,
    sourceDir,
    files
  };
}

async function readPreviousState() {
  try {
    return JSON.parse(await fs.readFile(statePath, "utf8"));
  } catch {
    return null;
  }
}

function sameState(a, b) {
  return JSON.stringify(a || null) === JSON.stringify(b || null);
}

async function hasGitChanges() {
  const { stdout } = await execFileAsync("git", ["status", "--porcelain"], {
    cwd: appRoot,
    maxBuffer: 16 * 1024 * 1024
  });
  return stdout.trim().length > 0;
}

async function main() {
  await fs.mkdir(analysisRoot, { recursive: true });
  const currentState = await sourceState();
  const previousState = await readPreviousState();
  if (sameState(currentState, previousState) && process.env.LEAGUE_FORCE_ANALYSIS !== "1") {
    console.log("No new League recordings.");
    return;
  }

  await run(npmBin, ["run", "sync:recordings"]);
  if (!(await hasGitChanges())) {
    await fs.writeFile(statePath, `${JSON.stringify(currentState, null, 2)}\n`, "utf8");
    console.log("League recordings synced; no public changes.");
    return;
  }

  await run("git", ["add", "--", ...publishPaths]);
  await run("git", ["commit", "-m", `Update League recordings ${new Date().toISOString().slice(0, 10)}`]);
  await run("git", ["pull", "--rebase", "origin", "main"]);
  await run("git", ["push", "origin", "main"]);
  await run(railwayBin, ["up", "--detach", "--message", "Update League recordings"]);
  await fs.writeFile(statePath, `${JSON.stringify(currentState, null, 2)}\n`, "utf8");
  console.log("League recordings published.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
