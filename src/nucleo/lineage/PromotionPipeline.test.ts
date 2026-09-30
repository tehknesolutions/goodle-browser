import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { activateDeployment, createEnvironmentState } from "./DeploymentChronicle";
import { sha256Json } from "./BuildLedger";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import { authorizeTrustedDeployment } from "./TrustedDeploymentGate";
import { promoteTrustedBuild, verifyPromotionReceipt } from "./PromotionPipeline";

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function bundle(): TrustedArtifactBundleV1 {
  const attestationUnsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: "build-promote",
    logical_build_id: "rbi-promote",
    graph_id: "graph-promote",
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
    attestation_id: `attest-${envelope_hash.slice(0, 12)}`,
    envelope_hash,
  };

  const content = "export const promoted = true;\n";
  const file = {
    path: ".goodle/generated/entry.tsx",
    content,
    media_type: "text/tsx" as const,
    sha256: sha256Text(content),
    provenance_refs: ["prov-1"],
  };

  const unsigned = {
    schema: "goodle.trusted-artifact-bundle.v1" as const,
    build_id: "build-promote",
    logical_build_id: "rbi-promote",
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

function activeDevelopment(sourceBundle: TrustedArtifactBundleV1) {
  const receipt = authorizeTrustedDeployment({
    action: "DEPLOY",
    environment: "development",
    bundle: sourceBundle,
  });

  return activateDeployment(
    createEnvironmentState("development"),
    receipt,
  );
}

describe("M24 Promotion Pipeline", () => {
  it("promotes the same logical build without rebuilding it", () => {
    const sourceBundle = bundle();
    const source = activeDevelopment(sourceBundle);
    const destination = createEnvironmentState("staging");

    const result = promoteTrustedBuild({
      source,
      destination,
      bundle: sourceBundle,
      policy: {
        allowed_transitions: [{ from: "development", to: "staging" }],
        destination_policy: {
          expected_adapter: "react",
          expected_kind: "web",
        },
      },
    });

    expect(result.destination.active_logical_build_id).toBe("rbi-promote");
    expect(result.destination.active_bundle_id).toBe(sourceBundle.bundle_id);
    expect(result.promotion_receipt).toMatchObject({
      from_environment: "development",
      to_environment: "staging",
      logical_build_id: "rbi-promote",
      bundle_id: sourceBundle.bundle_id,
      status: "PROMOTED",
    });
    expect(verifyPromotionReceipt(result.promotion_receipt)).toBe(true);
  });

  it("rejects disallowed environment transitions", () => {
    const sourceBundle = bundle();

    expect(() =>
      promoteTrustedBuild({
        source: activeDevelopment(sourceBundle),
        destination: createEnvironmentState("production"),
        bundle: sourceBundle,
        policy: {
          allowed_transitions: [{ from: "development", to: "staging" }],
        },
      }),
    ).toThrow("PROMOTION_TRANSITION_NOT_ALLOWED");
  });

  it("rejects bundle drift from the active source environment", () => {
    const sourceBundle = bundle();
    const drifted = {
      ...sourceBundle,
      logical_build_id: "rbi-other",
    };

    expect(() =>
      promoteTrustedBuild({
        source: activeDevelopment(sourceBundle),
        destination: createEnvironmentState("staging"),
        bundle: drifted,
        policy: {
          allowed_transitions: [{ from: "development", to: "staging" }],
        },
      }),
    ).toThrow("PROMOTION_LOGICAL_BUILD_MISMATCH");
  });
});
