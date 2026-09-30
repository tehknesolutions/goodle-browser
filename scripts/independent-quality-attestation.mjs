import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  createIndependentQualityAttestation,
  sha256File,
  verifyIndependentQualityAttestation,
} from "./lib/independent-quality-attestation.mjs";

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1]
    ? process.argv[index + 1]
    : fallback;
}

function gitHead() {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const mode = process.argv[2];
if (!["create", "verify"].includes(mode)) {
  console.error(
    "Usage: node scripts/independent-quality-attestation.mjs <create|verify> --report <path> [--out <path>|--attestation <path>]",
  );
  process.exit(2);
}

const reportPath = resolve(
  arg("--report", ".goodle/quality/independent-validation.json"),
);
const report = readJson(reportPath);
const reportSha256 = sha256File(reportPath);
const expectedCommitSha = arg("--commit", gitHead());

if (mode === "create") {
  const outputPath = resolve(
    arg("--out", ".goodle/quality/independent-attestation.json"),
  );
  const attestation = createIndependentQualityAttestation({
    report,
    reportSha256,
    expectedCommitSha,
  });

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(attestation, null, 2) + "\n", "utf8");

  const verification = verifyIndependentQualityAttestation({
    attestation,
    report,
    reportSha256,
    expectedCommitSha,
  });

  if (!verification.valid) {
    console.error("Independent quality attestation self-verification: FAIL");
    console.error(verification.reasons.join("\n"));
    process.exit(1);
  }

  console.log("Independent quality attestation: PASS");
  console.log("Attestation:", outputPath);
  console.log("Attestation ID:", attestation.attestation_id);
  process.exit(0);
}

const attestationPath = resolve(
  arg("--attestation", ".goodle/quality/independent-attestation.json"),
);
const attestation = readJson(attestationPath);
const verification = verifyIndependentQualityAttestation({
  attestation,
  report,
  reportSha256,
  expectedCommitSha,
});

console.log(
  "Independent quality attestation verification:",
  verification.valid ? "PASS" : "FAIL",
);
if (!verification.valid) {
  console.error(verification.reasons.join("\n"));
}
process.exit(verification.valid ? 0 : 1);
