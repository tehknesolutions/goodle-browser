import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function run(command, args) {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  return {
    command: [command, ...args].join(" "),
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    exit_code: result.status ?? 1,
    signal: result.signal ?? null,
    status: result.status === 0 ? "PASS" : "FAIL",
  };
}

function safe(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const reportArg = process.argv.indexOf("--report");
const reportPath = resolve(
  reportArg >= 0 && process.argv[reportArg + 1]
    ? process.argv[reportArg + 1]
    : ".goodle/quality/independent-validation.json",
);

const steps = [
  ["npm", ["test"]],
  ["npm", ["run", "check"]],
  ["npm", ["run", "build"]],
];

const startedAt = new Date().toISOString();
const results = [];
let overall = "PASS";

for (const [command, args] of steps) {
  const result = run(command, args);
  results.push(result);
  if (result.status !== "PASS") {
    overall = "FAIL";
    break;
  }
}

const report = {
  schema: "goodle.independent-quality-gate-report.v1",
  gate: "M70",
  started_at: startedAt,
  finished_at: new Date().toISOString(),
  status: overall,
  git: {
    commit_sha: safe("git", ["rev-parse", "HEAD"]),
    branch: safe("git", ["branch", "--show-current"]),
    dirty: safe("git", ["status", "--porcelain"]) ? true : false,
  },
  runtime: {
    node: process.version,
    npm: safe(process.platform === "win32" ? "npm.cmd" : "npm", ["--version"]),
    platform: process.platform,
    arch: process.arch,
  },
  steps: results,
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log("\nIndependent quality gate:", overall);
console.log("Report:", reportPath);

process.exit(overall === "PASS" ? 0 : 1);
