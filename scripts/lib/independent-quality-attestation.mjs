import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  }
  return value;
}

export function sha256Json(value) {
  return createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex");
}

export function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function normalizeStep(step) {
  return {
    command: step.command,
    exit_code: step.exit_code,
    signal: step.signal ?? null,
    status: step.status,
  };
}

function reportFacts(report) {
  return {
    schema: report.schema,
    gate: report.gate,
    status: report.status,
    git: {
      commit_sha: report.git?.commit_sha,
      tracked_dirty: report.git?.tracked_dirty,
    },
    runtime: {
      node: report.runtime?.node,
      npm: report.runtime?.npm,
      platform: report.runtime?.platform,
      arch: report.runtime?.arch,
    },
    steps: Array.isArray(report.steps) ? report.steps.map(normalizeStep) : [],
  };
}

export function validateQualityReport(report, expectedCommitSha) {
  const reasons = [];

  if (report?.schema !== "goodle.independent-quality-gate-report.v1") {
    reasons.push("QUALITY_REPORT_SCHEMA_INVALID");
  }
  if (report?.gate !== "M70") {
    reasons.push("QUALITY_REPORT_GATE_INVALID");
  }
  if (report?.status !== "PASS") {
    reasons.push("QUALITY_REPORT_NOT_PASS");
  }
  if (report?.git?.tracked_dirty !== false) {
    reasons.push("QUALITY_REPORT_TRACKED_DIRTY");
  }
  if (!report?.git?.commit_sha) {
    reasons.push("QUALITY_REPORT_COMMIT_MISSING");
  }
  if (expectedCommitSha && report?.git?.commit_sha !== expectedCommitSha) {
    reasons.push("QUALITY_REPORT_COMMIT_MISMATCH");
  }

  const steps = Array.isArray(report?.steps) ? report.steps : [];
  if (steps.length !== 3) {
    reasons.push("QUALITY_REPORT_STEP_COUNT_INVALID");
  }

  const expected = ["npm test", "npm run check", "npm run build"];
  expected.forEach((command, index) => {
    const step = steps[index];
    if (!step || step.command !== command) {
      reasons.push(`QUALITY_REPORT_STEP_${index + 1}_COMMAND_INVALID`);
    } else if (step.status !== "PASS" || step.exit_code !== 0) {
      reasons.push(`QUALITY_REPORT_STEP_${index + 1}_FAILED`);
    }
  });

  return { valid: reasons.length === 0, reasons };
}

export function createIndependentQualityAttestation({
  report,
  reportSha256,
  expectedCommitSha,
  createdAt = new Date().toISOString(),
}) {
  const validation = validateQualityReport(report, expectedCommitSha);
  if (!validation.valid) {
    throw new Error(`INVALID_QUALITY_REPORT:${validation.reasons.join(",")}`);
  }

  const facts = reportFacts(report);
  const factsSha256 = sha256Json(facts);
  const payload = {
    schema: "goodle.independent-quality-gate-attestation.v1",
    gate: "M71",
    quality_report: {
      schema: report.schema,
      sha256: reportSha256,
      facts_sha256: factsSha256,
    },
    git: {
      commit_sha: report.git.commit_sha,
    },
    runtime: facts.runtime,
    steps: facts.steps,
    created_at: createdAt,
  };

  const attestationHash = sha256Json(payload);

  return {
    ...payload,
    attestation_id: `quality-attestation-${attestationHash.slice(0, 16)}`,
    attestation_hash: attestationHash,
  };
}

export function verifyIndependentQualityAttestation({
  attestation,
  report,
  reportSha256,
  expectedCommitSha,
}) {
  const reasons = [];
  const validation = validateQualityReport(report, expectedCommitSha);
  reasons.push(...validation.reasons);

  if (attestation?.schema !== "goodle.independent-quality-gate-attestation.v1") {
    reasons.push("ATTESTATION_SCHEMA_INVALID");
  }
  if (attestation?.gate !== "M71") {
    reasons.push("ATTESTATION_GATE_INVALID");
  }
  if (attestation?.quality_report?.sha256 !== reportSha256) {
    reasons.push("QUALITY_REPORT_SHA256_MISMATCH");
  }

  const facts = reportFacts(report);
  const expectedFactsHash = sha256Json(facts);
  if (attestation?.quality_report?.facts_sha256 !== expectedFactsHash) {
    reasons.push("QUALITY_FACTS_SHA256_MISMATCH");
  }
  if (attestation?.git?.commit_sha !== report?.git?.commit_sha) {
    reasons.push("ATTESTATION_COMMIT_MISMATCH");
  }
  if (expectedCommitSha && attestation?.git?.commit_sha !== expectedCommitSha) {
    reasons.push("ATTESTATION_EXPECTED_COMMIT_MISMATCH");
  }
  if (sha256Json(attestation?.runtime) !== sha256Json(facts.runtime)) {
    reasons.push("ATTESTATION_RUNTIME_MISMATCH");
  }
  if (sha256Json(attestation?.steps) !== sha256Json(facts.steps)) {
    reasons.push("ATTESTATION_STEPS_MISMATCH");
  }

  const unsigned = {
    schema: attestation?.schema,
    gate: attestation?.gate,
    quality_report: attestation?.quality_report,
    git: attestation?.git,
    runtime: attestation?.runtime,
    steps: attestation?.steps,
    created_at: attestation?.created_at,
  };
  const expectedHash = sha256Json(unsigned);

  if (attestation?.attestation_hash !== expectedHash) {
    reasons.push("ATTESTATION_HASH_INVALID");
  }
  if (
    attestation?.attestation_id !==
    `quality-attestation-${expectedHash.slice(0, 16)}`
  ) {
    reasons.push("ATTESTATION_ID_INVALID");
  }

  return {
    schema: "goodle.independent-quality-gate-attestation-verification.v1",
    valid: reasons.length === 0,
    reasons,
    commit_sha: report?.git?.commit_sha,
    attestation_id: attestation?.attestation_id,
  };
}
