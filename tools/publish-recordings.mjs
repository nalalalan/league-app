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
const lockPath = path.join(analysisRoot, "publish-recordings.lock");
const retryStatePath = path.join(analysisRoot, "analysis-retry-state.json");
const sourceDir = process.env.LEAGUE_RECORDINGS_DIR || "C:\\Users\\phama\\Documents\\League of Legends\\Highlights";
const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
const railwayBin = process.platform === "win32" ? "railway.cmd" : "railway";
const sourceVideoPattern = /\.(webm|mp4)$/i;
const fallbackRetryMs = Number(process.env.LEAGUE_ANALYSIS_RETRY_MINUTES || 60) * 60 * 1000;
const publishPaths = [
  "public/recordings",
  "public/app.js",
  "public/index.html",
  "public/styles.css",
  "public/league-practice-room.pdf",
  "public/league-practice-room.tex",
  "server.js",
  "tools/sync-recordings.mjs",
  "tools/league-live-recorder.mjs",
  "tools/publish-recordings.mjs",
  "tools/publish-recordings.ps1",
  "tools/install-live-recorder-task.ps1",
  "tools/install-league-automation.ps1",
  "README.md"
];
const ignoredSourceVideoPattern = /\.with-desktop-pauses\.(webm|mp4)$/i;

function commandNeedsShell(command) {
  return process.platform === "win32" && /\.cmd$/i.test(command);
}

function shellArg(arg) {
  const value = String(arg);
  if (!/[\s"]/u.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

async function run(command, args, options = {}) {
  const useShell = commandNeedsShell(command);
  const result = await execFileAsync(command, useShell ? args.map(shellArg) : args, {
    cwd: appRoot,
    maxBuffer: 64 * 1024 * 1024,
    shell: useShell,
    windowsHide: true,
    ...options
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

function processIsAlive(pid) {
  const id = Number(pid);
  if (!Number.isFinite(id) || id <= 0) return false;
  try {
    process.kill(id, 0);
    return true;
  } catch {
    return false;
  }
}

async function acquireLock() {
  await fs.mkdir(analysisRoot, { recursive: true });
  try {
    const handle = await fs.open(lockPath, "wx");
    await handle.writeFile(String(process.pid), "utf8");
    await handle.close();
    return true;
  } catch {
    const lockPid = (await fs.readFile(lockPath, "utf8").catch(() => "")).trim();
    const stat = await fs.stat(lockPath).catch(() => null);
    const stale = stat && Date.now() - stat.mtimeMs > 45 * 60 * 1000;
    if ((lockPid && !processIsAlive(lockPid)) || stale) {
      await fs.unlink(lockPath).catch(() => {});
      return acquireLock();
    }
    console.log("League recording publish already running.");
    return false;
  }
}

async function releaseLock() {
  await fs.unlink(lockPath).catch(() => {});
}

async function sourceState() {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile() || !sourceVideoPattern.test(entry.name) || ignoredSourceVideoPattern.test(entry.name)) continue;
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

async function hasStagedChanges() {
  const { stdout } = await execFileAsync("git", ["diff", "--cached", "--name-only"], {
    cwd: appRoot,
    maxBuffer: 16 * 1024 * 1024
  });
  return stdout.trim().length > 0;
}

async function gitPorcelain() {
  const { stdout } = await execFileAsync("git", ["status", "--porcelain=v1", "--ignored=no"], {
    cwd: appRoot,
    maxBuffer: 16 * 1024 * 1024
  });
  return stdout.trim();
}

async function needsAnalysisRetry() {
  if (!process.env.OPENAI_API_KEY) return false;
  if (process.env.LEAGUE_RETRY_FALLBACK !== "1" && process.env.LEAGUE_FORCE_ANALYSIS !== "1") return false;
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(appRoot, "public", "recordings", "recordings.json"), "utf8"));
    const hasFallback = Array.isArray(manifest.recordings) && manifest.recordings.some((item) => item.analysisSource === "fallback");
    if (!hasFallback) return false;
    if (process.env.LEAGUE_FORCE_ANALYSIS === "1") return true;
    const state = JSON.parse(await fs.readFile(retryStatePath, "utf8").catch(() => "{}"));
    return Date.now() - Number(state.lastAttemptMs || 0) > fallbackRetryMs;
  } catch {
    return false;
  }
}

async function markAnalysisRetry() {
  await fs.writeFile(retryStatePath, `${JSON.stringify({
    lastAttemptAt: new Date().toISOString(),
    lastAttemptMs: Date.now()
  }, null, 2)}\n`, "utf8");
}

async function main() {
  if (!(await acquireLock())) return;
  await fs.mkdir(analysisRoot, { recursive: true });
  try {
    const currentState = await sourceState();
    const previousState = await readPreviousState();
    const retryAnalysis = await needsAnalysisRetry();
    if (sameState(currentState, previousState) && process.env.LEAGUE_FORCE_ANALYSIS !== "1" && !retryAnalysis) {
      console.log("No new League recordings.");
      return;
    }

    const before = await gitPorcelain();
    if (before && process.env.LEAGUE_FORCE_PUBLISH_DIRTY !== "1") {
      console.log(`League publish skipped because the repo has active local edits:\n${before}`);
      return;
    }

    await run("git", ["pull", "--rebase", "origin", "main"]);
    if (retryAnalysis) await markAnalysisRetry();
    await run(npmBin, ["run", "sync:recordings"]);
    if (!(await hasGitChanges())) {
      await fs.writeFile(statePath, `${JSON.stringify(currentState, null, 2)}\n`, "utf8");
      console.log("League recordings synced; no public changes.");
      return;
    }

    await run("git", ["add", "-f", "--", ...publishPaths]);
    if (!(await hasStagedChanges())) {
      console.log("League recordings synced; no publishable changes.");
      return;
    }
    await run("git", ["commit", "-m", `Update League recordings ${new Date().toISOString().slice(0, 10)}`]);
    await run("git", ["pull", "--rebase", "origin", "main"]);
    await run("git", ["push", "origin", "main"]);
    await run(railwayBin, ["up", "--detach", "--message", "Update League recordings"]);
    await fs.writeFile(statePath, `${JSON.stringify(currentState, null, 2)}\n`, "utf8");
    console.log("League recordings published.");
  } finally {
    await releaseLock();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
