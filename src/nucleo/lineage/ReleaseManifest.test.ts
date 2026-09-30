import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import {
  createReleaseCandidate,
  releaseCandidate,
  revokeRelease,
  verifyReleaseManifest,
} from "./ReleaseManifest";

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function bundle(certification_status: "CERTIFIED" | "PARTIAL" = "CERTIFIED"): TrustedArtifactBundleV1 {
  const attestationUnsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: "build-release",
    logical_build_id: "rbi-release",
    graph_id: "graph-release",
    target: { kind: "web" as const, adapter: "react", version: "19" },
    certification_status,
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
    attestation_id: `attest-${envelope_hash.slice(0, 12)}`,
    envelope_hash,
  };

  const content = "export const release = true;\n";
  const file = {
    path: ".goodle/generated/entry.tsx",
    content,
    media_type: "text/tsx" as const,
    sha256: sha256Text(content),
    provenance_refs: ["prov-1"],
  };

  const unsigned = {
    schema: "goodle.trusted-artifact-bundle.v1" as const,
    build_id: "build-release",
    logical_build_id: "rbi-release",
    attestation,
    entries: [".goodle/generated/entry.tsx"],
    files: [file],
  };

  const bundle_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    bundle_id: `bundle-${bundle_hash.slice(0, 12)}`,
    bundle_hash,
  };
}

const policy = {
  allowed_transitions: [
    { from: "development", to: "staging" },
    { from: "staging", to: "production" },
  ],
};

describe("M25 Release Manifest", () => {
  it("creates a release candidate from an intact certified bundle", () => {
    const manifest = createReleaseCandidate({
      version: "1.0.0-rc.1",
      bundle: bundle(),
      promotion_policy: policy,
    });

    expect(manifest).toMatchObject({
      status: "RC",
      version: "1.0.0-rc.1",
      logical_build_id: "rbi-release",
      certification_status: "CERTIFIED",
    });
    expect(verifyReleaseManifest(manifest)).toBe(true);
  });

  it("promotes RC to RELEASED without changing bundle identity", () => {
    const rc = createReleaseCandidate({
      version: "1.0.0",
      bundle: bundle(),
      promotion_policy: policy,
    });
    const released = releaseCandidate(rc);

    expect(released.status).toBe("RELEASED");
    expect(released.bundle_id).toBe(rc.bundle_id);
    expect(released.logical_build_id).toBe(rc.logical_build_id);
    expect(verifyReleaseManifest(released)).toBe(true);
  });

  it("revokes a release with explicit reason", () => {
    const rc = createReleaseCandidate({
      version: "1.0.0",
      bundle: bundle(),
      promotion_policy: policy,
    });
    const revoked = revokeRelease(releaseCandidate(rc), "security issue");

    expect(revoked).toMatchObject({
      status: "REVOKED",
      revoked_reason: "security issue",
    });
    expect(verifyReleaseManifest(revoked)).toBe(true);
  });

  it("rejects non-certified builds as release candidates", () => {
    expect(() =>
      createReleaseCandidate({
        version: "1.0.0-rc.1",
        bundle: bundle("PARTIAL"),
        promotion_policy: policy,
      }),
    ).toThrow("RELEASE_REQUIRES_CERTIFIED_BUILD");
  });
});
