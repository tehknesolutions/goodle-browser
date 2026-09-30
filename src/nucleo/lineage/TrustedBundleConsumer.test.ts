import { describe, expect, it } from "vitest";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import {
  assertTrustedBundleExecutable,
  evaluateTrustedBundle,
} from "./TrustedBundleConsumer";
import { sha256Json } from "./BuildLedger";
import { createHash } from "node:crypto";

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function bundle(certification_status: "CERTIFIED" | "PARTIAL" | "REJECTED" = "CERTIFIED"): TrustedArtifactBundleV1 {
  const attestationUnsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: "build-consumer",
    logical_build_id: "rbi-consumer",
    graph_id: "graph-consumer",
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

  const file = {
    path: ".goodle/generated/entry.tsx",
    content: "export const trusted = true;\n",
    media_type: "text/tsx" as const,
    sha256: sha256Text("export const trusted = true;\n"),
    provenance_refs: ["prov-1"],
  };

  const unsigned = {
    schema: "goodle.trusted-artifact-bundle.v1" as const,
    build_id: "build-consumer",
    logical_build_id: "rbi-consumer",
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

describe("M21 Trusted Bundle Consumer", () => {
  it("accepts a certified intact bundle", () => {
    const result = evaluateTrustedBundle(bundle(), {
      expected_adapter: "react",
      expected_kind: "web",
    });

    expect(result).toMatchObject({
      decision: "ACCEPTED",
      executable: true,
      reasons: [],
    });
  });

  it("quarantines a partial bundle by policy", () => {
    const result = evaluateTrustedBundle(bundle("PARTIAL"));

    expect(result).toMatchObject({
      decision: "QUARANTINED",
      executable: false,
    });
    expect(result.reasons).toContain("CERTIFICATION_NOT_CERTIFIED");
  });

  it("rejects tampered files", () => {
    const original = bundle();
    const tampered = {
      ...original,
      files: original.files.map((file) => ({ ...file, content: file.content + "// tampered\n" })),
    };

    const result = evaluateTrustedBundle(tampered);

    expect(result.decision).toBe("REJECTED");
    expect(result.reasons).toContain("FILE_INTEGRITY_FAILED");
  });

  it("quarantines target mismatches", () => {
    const result = evaluateTrustedBundle(bundle(), {
      expected_adapter: "phaser",
      expected_kind: "game",
    });

    expect(result.decision).toBe("QUARANTINED");
    expect(result.reasons).toContain("ADAPTER_MISMATCH");
    expect(result.reasons).toContain("KIND_MISMATCH");
  });

  it("prevents execution unless accepted", () => {
    const result = evaluateTrustedBundle(bundle("REJECTED"));

    expect(() => assertTrustedBundleExecutable(result)).toThrow(
      "TRUSTED_BUNDLE_NOT_EXECUTABLE",
    );
  });
});
