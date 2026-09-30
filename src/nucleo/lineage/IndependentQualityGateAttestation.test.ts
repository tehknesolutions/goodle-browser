import { describe, expect, it } from "vitest";
import {
  createIndependentQualityAttestation,
  sha256Json,
  verifyIndependentQualityAttestation,
} from "../../../scripts/lib/independent-quality-attestation.mjs";

const COMMIT = "a".repeat(40);

function report() {
  return {
    schema: "goodle.independent-quality-gate-report.v1",
    gate: "M70",
    started_at: "2026-09-30T00:00:00.000Z",
    finished_at: "2026-09-30T00:01:00.000Z",
    status: "PASS",
    git: {
      commit_sha: COMMIT,
      branch: "main",
      tracked_dirty: false,
    },
    runtime: {
      node: "v24.18.0",
      npm: "11.16.0",
      platform: "win32",
      arch: "x64",
    },
    steps: [
      {
        command: "npm test",
        exit_code: 0,
        signal: null,
        status: "PASS",
      },
      {
        command: "npm run check",
        exit_code: 0,
        signal: null,
        status: "PASS",
      },
      {
        command: "npm run build",
        exit_code: 0,
        signal: null,
        status: "PASS",
      },
    ],
  };
}

function create() {
  const qualityReport = report();
  const reportSha256 = sha256Json(qualityReport);
  const attestation = createIndependentQualityAttestation({
    report: qualityReport,
    reportSha256,
    expectedCommitSha: COMMIT,
    createdAt: "2026-09-30T00:02:00.000Z",
  });
  return { qualityReport, reportSha256, attestation };
}

describe("M71 Independent Quality Gate Attestation", () => {
  it("binds a passing M70 report to the expected commit and toolchain", () => {
    const { qualityReport, reportSha256, attestation } = create();

    const verification = verifyIndependentQualityAttestation({
      attestation,
      report: qualityReport,
      reportSha256,
      expectedCommitSha: COMMIT,
    });

    expect(verification.valid).toBe(true);
    expect(verification.reasons).toEqual([]);
    expect(attestation.attestation_id).toMatch(/^quality-attestation-/);
  });

  it("detects quality report tampering", () => {
    const { qualityReport, reportSha256, attestation } = create();
    qualityReport.runtime.node = "v0.0.0";

    const verification = verifyIndependentQualityAttestation({
      attestation,
      report: qualityReport,
      reportSha256,
      expectedCommitSha: COMMIT,
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain("QUALITY_FACTS_SHA256_MISMATCH");
    expect(verification.reasons).toContain("ATTESTATION_RUNTIME_MISMATCH");
  });

  it("detects attestation tampering", () => {
    const { qualityReport, reportSha256, attestation } = create();
    attestation.steps[0].status = "FAIL";

    const verification = verifyIndependentQualityAttestation({
      attestation,
      report: qualityReport,
      reportSha256,
      expectedCommitSha: COMMIT,
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain("ATTESTATION_STEPS_MISMATCH");
    expect(verification.reasons).toContain("ATTESTATION_HASH_INVALID");
  });

  it("rejects a report from another commit", () => {
    const { qualityReport, reportSha256, attestation } = create();

    const verification = verifyIndependentQualityAttestation({
      attestation,
      report: qualityReport,
      reportSha256,
      expectedCommitSha: "b".repeat(40),
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain("QUALITY_REPORT_COMMIT_MISMATCH");
    expect(verification.reasons).toContain(
      "ATTESTATION_EXPECTED_COMMIT_MISMATCH",
    );
  });
});
