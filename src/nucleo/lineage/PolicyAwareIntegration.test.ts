import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  allowEnvironmentTransition,
  createEnvironmentPolicyRegistry,
  registerEnvironmentPolicy,
} from "./EnvironmentPolicyRegistry";
import {
  activateDeployment,
  createEnvironmentState,
} from "./DeploymentChronicle";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import { sha256Json } from "./BuildLedger";
import { authorizeTrustedDeployment } from "./TrustedDeploymentGate";
import {
  createReleaseCandidate,
  releaseCandidate,
} from "./ReleaseManifest";
import {
  authorizePolicyAwareDeployment,
  promotePolicyAwareReleasedBuildToProduction,
  promotePolicyAwareTrustedBuild,
} from "./PolicyAwareIntegration";

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function registry() {
  let value = createEnvironmentPolicyRegistry();

  value = registerEnvironmentPolicy(value, {
    environment: "development",
    require_certified: false,
    allow_partial: true,
    allowed_adapters: ["react"],
    allowed_kinds: ["web"],
    require_released_manifest: false,
  });

  value = registerEnvironmentPolicy(value, {
    environment: "staging",
    require_certified: true,
    allow_partial: false,
    allowed_adapters: ["react"],
    allowed_kinds: ["web"],
    require_released_manifest: false,
  });

  value = registerEnvironmentPolicy(value, {
    environment: "production",
    require_certified: true,
    allow_partial: false,
    allowed_adapters: ["react"],
    allowed_kinds: ["web"],
    require_released_manifest: true,
  });

  value = allowEnvironmentTransition(value, {
    from: "development",
    to: "staging",
  });
  value = allowEnvironmentTransition(value, {
    from: "staging",
    to: "production",
  });

  return value;
}

function bundle(): TrustedArtifactBundleV1 {
  const attestationUnsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: "build-policy",
    logical_build_id: "rbi-policy",
    graph_id: "graph-policy",
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

  const content = "export const policyAware = true;\n";
  const file = {
    path: ".goodle/generated/entry.tsx",
    content,
    media_type: "text/tsx" as const,
    sha256: sha256Text(content),
    provenance_refs: ["prov-1"],
  };

  const unsigned = {
    schema: "goodle.trusted-artifact-bundle.v1" as const,
    build_id: "build-policy",
    logical_build_id: "rbi-policy",
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

function active(environment: string, sourceBundle: TrustedArtifactBundleV1) {
  const receipt = authorizeTrustedDeployment({
    action: "DEPLOY",
    environment,
    bundle: sourceBundle,
  });

  return activateDeployment(createEnvironmentState(environment), receipt);
}

describe("M30 Policy-Aware Integration", () => {
  it("derives deployment trust policy from the registry", () => {
    const receipt = authorizePolicyAwareDeployment({
      registry: registry(),
      action: "DEPLOY",
      environment: "staging",
      bundle: bundle(),
    });

    expect(receipt.status).toBe("AUTHORIZED");
    expect(receipt.verification.decision).toBe("ACCEPTED");
  });

  it("blocks direct production deployment without RELEASED status", () => {
    expect(() =>
      authorizePolicyAwareDeployment({
        registry: registry(),
        action: "DEPLOY",
        environment: "production",
        bundle: bundle(),
      }),
    ).toThrow("ENVIRONMENT_REQUIRES_RELEASED_MANIFEST");
  });

  it("uses registry transitions for promotion", () => {
    const sourceBundle = bundle();
    const result = promotePolicyAwareTrustedBuild({
      registry: registry(),
      source: active("development", sourceBundle),
      destination: createEnvironmentState("staging"),
      bundle: sourceBundle,
    });

    expect(result.destination.active_logical_build_id).toBe("rbi-policy");
  });

  it("rejects a transition missing from the registry", () => {
    const sourceBundle = bundle();

    expect(() =>
      promotePolicyAwareTrustedBuild({
        registry: registry(),
        source: active("development", sourceBundle),
        destination: createEnvironmentState("production"),
        bundle: sourceBundle,
      }),
    ).toThrow("ENVIRONMENT_TRANSITION_NOT_ALLOWED");
  });

  it("makes production release promotion use registry governance", () => {
    const sourceBundle = bundle();
    const release = releaseCandidate(
      createReleaseCandidate({
        version: "1.0.0",
        bundle: sourceBundle,
        promotion_policy: { allowed_transitions: [] },
      }),
    );

    const result = promotePolicyAwareReleasedBuildToProduction({
      registry: registry(),
      source: active("staging", sourceBundle),
      production: createEnvironmentState("production"),
      bundle: sourceBundle,
      release,
    });

    expect(result.production).toMatchObject({
      active_release_id: expect.any(String),
      active_release_version: "1.0.0",
      active_logical_build_id: "rbi-policy",
    });
  });
});
