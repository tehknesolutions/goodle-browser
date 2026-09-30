import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { activateDeployment, createEnvironmentState } from "./DeploymentChronicle";
import { authorizeTrustedDeployment } from "./TrustedDeploymentGate";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import { sha256Json } from "./BuildLedger";
import {
  createReleaseCandidate,
  releaseCandidate,
} from "./ReleaseManifest";
import {
  promoteReleasedBuildToProduction,
  verifyProductionReleaseReceipt,
} from "./ProductionReleaseGate";

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function bundle(): TrustedArtifactBundleV1 {
  const attestationUnsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: "build-production",
    logical_build_id: "rbi-production",
    graph_id: "graph-production",
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

  const content = "export const production = true;\n";
  const file = {
    path: ".goodle/generated/entry.tsx",
    content,
    media_type: "text/tsx" as const,
    sha256: sha256Text(content),
    provenance_refs: ["prov-1"],
  };

  const unsigned = {
    schema: "goodle.trusted-artifact-bundle.v1" as const,
    build_id: "build-production",
    logical_build_id: "rbi-production",
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

function activeStaging(sourceBundle: TrustedArtifactBundleV1) {
  const receipt = authorizeTrustedDeployment({
    action: "DEPLOY",
    environment: "staging",
    bundle: sourceBundle,
  });

  return activateDeployment(
    createEnvironmentState("staging"),
    receipt,
  );
}

describe("M26 Production Release Gate", () => {
  it("requires RELEASED manifest and records active release in production", () => {
    const sourceBundle = bundle();
    const release = releaseCandidate(
      createReleaseCandidate({
        version: "1.0.0",
        bundle: sourceBundle,
        promotion_policy: {
          allowed_transitions: [{ from: "staging", to: "production" }],
          destination_policy: {
            expected_adapter: "react",
            expected_kind: "web",
          },
        },
      }),
    );

    const result = promoteReleasedBuildToProduction({
      source: activeStaging(sourceBundle),
      production: createEnvironmentState("production"),
      bundle: sourceBundle,
      release,
    });

    expect(result.production).toMatchObject({
      environment: "production",
      active_logical_build_id: "rbi-production",
      active_release_id: release.release_id,
      active_release_version: "1.0.0",
    });
    expect(result.production_release_receipt).toMatchObject({
      release_id: release.release_id,
      version: "1.0.0",
      status: "ACTIVE",
    });
    expect(
      verifyProductionReleaseReceipt(result.production_release_receipt),
    ).toBe(true);
  });

  it("rejects RC manifests for production", () => {
    const sourceBundle = bundle();
    const rc = createReleaseCandidate({
      version: "1.0.0-rc.1",
      bundle: sourceBundle,
      promotion_policy: {
        allowed_transitions: [{ from: "staging", to: "production" }],
      },
    });

    expect(() =>
      promoteReleasedBuildToProduction({
        source: activeStaging(sourceBundle),
        production: createEnvironmentState("production"),
        bundle: sourceBundle,
        release: rc,
      }),
    ).toThrow("PRODUCTION_REQUIRES_RELEASED_MANIFEST");
  });

  it("rejects release/bundle mismatch", () => {
    const sourceBundle = bundle();
    const release = releaseCandidate(
      createReleaseCandidate({
        version: "1.0.0",
        bundle: sourceBundle,
        promotion_policy: {
          allowed_transitions: [{ from: "staging", to: "production" }],
        },
      }),
    );

    expect(() =>
      promoteReleasedBuildToProduction({
        source: activeStaging(sourceBundle),
        production: createEnvironmentState("production"),
        bundle: { ...sourceBundle, bundle_id: "bundle-other" },
        release,
      }),
    ).toThrow("PRODUCTION_RELEASE_BUNDLE_MISMATCH");
  });
});
