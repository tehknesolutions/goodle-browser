import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createEnvironmentPolicyRegistry,
  registerEnvironmentPolicy,
} from "./EnvironmentPolicyRegistry";
import { sha256Json } from "./BuildLedger";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import {
  authorizeAttestedPolicyAwareDeployment,
} from "./PolicyAwareIntegration";
import { verifyGovernanceSnapshot } from "./GovernanceSnapshot";

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function registry() {
  let value = createEnvironmentPolicyRegistry();
  value = registerEnvironmentPolicy(value, {
    environment: "staging",
    require_certified: true,
    allow_partial: false,
    allowed_adapters: ["react"],
    allowed_kinds: ["web"],
    require_released_manifest: false,
  });
  return value;
}

function bundle(): TrustedArtifactBundleV1 {
  const attestationUnsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: "build-governance",
    logical_build_id: "rbi-governance",
    graph_id: "graph-governance",
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

  const content = "export const governed = true;\n";
  const file = {
    path: ".goodle/generated/entry.tsx",
    content,
    media_type: "text/tsx" as const,
    sha256: sha256Text(content),
    provenance_refs: ["prov-1"],
  };

  const unsigned = {
    schema: "goodle.trusted-artifact-bundle.v1" as const,
    build_id: "build-governance",
    logical_build_id: "rbi-governance",
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

describe("M31 Policy Attestation Integration", () => {
  it("emits receipt and immutable governance snapshot together", () => {
    const policies = registry();

    const result = authorizeAttestedPolicyAwareDeployment({
      registry: policies,
      action: "DEPLOY",
      environment: "staging",
      bundle: bundle(),
    });

    expect(result.deployment_receipt.status).toBe("AUTHORIZED");
    expect(result.governance_snapshot).toMatchObject({
      registry_hash: policies.registry_hash,
      operation: "DEPLOY",
      destination_environment: "staging",
    });
    expect(verifyGovernanceSnapshot(result.governance_snapshot)).toBe(true);
  });
});
