import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import {
  assertSecurityHardened,
  evaluateSecurityHardening,
} from "./SecurityHardeningGate";

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function bundle(path = ".goodle/generated/entry.tsx", provenance = ["prov-1"]): TrustedArtifactBundleV1 {
  const attestationUnsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: "build-sec",
    logical_build_id: "rbi-sec",
    graph_id: "graph-sec",
    target: { kind: "web" as const, adapter: "react", version: "19" },
    certification_status: "CERTIFIED" as const,
    trust: {
      report_hash: "report",
      certification_hash: "cert",
      ledger_hash: "ledger",
      identity_hash: "identity",
    },
    provenance_refs: ["prov-1"],
    artifact_entries: [".goodle/generated/entry.tsx"],
  };
  const envelope_hash = sha256Json(attestationUnsigned);
  const attestation = {
    ...attestationUnsigned,
    attestation_id: "attest-sec",
    envelope_hash,
  };

  const content = "export const secure = true;\n";
  const files = [{
    path,
    content,
    media_type: "text/tsx" as const,
    sha256: sha256Text(content),
    provenance_refs: provenance,
  }];

  const unsigned = {
    schema: "goodle.trusted-artifact-bundle.v1" as const,
    build_id: "build-sec",
    logical_build_id: "rbi-sec",
    attestation,
    entries: [".goodle/generated/entry.tsx"],
    files,
  };

  return {
    ...unsigned,
    bundle_id: "bundle-sec",
    bundle_hash: sha256Json(unsigned),
  };
}

describe("M40 Security Hardening Gate", () => {
  it("passes a safe bounded bundle", () => {
    const report = evaluateSecurityHardening(bundle(), {
      max_files: 10,
      max_total_bytes: 1024,
      max_single_file_bytes: 1024,
      require_file_provenance: true,
    });

    expect(report.status).toBe("HARDENED");
    expect(report.reasons).toEqual([]);
    expect(() => assertSecurityHardened(report)).not.toThrow();
  });

  it("blocks traversal paths even when hashes are internally consistent", () => {
    const report = evaluateSecurityHardening(bundle("../escape.tsx"), {
      max_files: 10,
      max_total_bytes: 1024,
      max_single_file_bytes: 1024,
      require_file_provenance: true,
    });

    expect(report.status).toBe("BLOCKED");
    expect(report.checks.path_safety).toBe(false);
    expect(report.reasons).toContain("BUNDLE_PATH_SAFETY_FAILED");
  });

  it("blocks missing file provenance", () => {
    const report = evaluateSecurityHardening(bundle(".goodle/a.tsx", []), {
      max_files: 10,
      max_total_bytes: 1024,
      max_single_file_bytes: 1024,
      require_file_provenance: true,
    });

    expect(report.status).toBe("BLOCKED");
    expect(report.reasons).toContain("BUNDLE_FILE_PROVENANCE_REQUIRED");
  });

  it("blocks bundle size limits", () => {
    const report = evaluateSecurityHardening(bundle(), {
      max_files: 0,
      max_total_bytes: 1,
      max_single_file_bytes: 1,
      require_file_provenance: false,
    });

    expect(report.status).toBe("BLOCKED");
    expect(report.reasons).toEqual(
      expect.arrayContaining([
        "BUNDLE_FILE_COUNT_LIMIT_EXCEEDED",
        "BUNDLE_TOTAL_BYTES_LIMIT_EXCEEDED",
        "BUNDLE_SINGLE_FILE_BYTES_LIMIT_EXCEEDED",
      ]),
    );
  });
});
