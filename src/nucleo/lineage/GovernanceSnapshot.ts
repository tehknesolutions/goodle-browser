import type {
  EnvironmentPolicyRegistryV1,
  EnvironmentPolicyV1,
} from "./EnvironmentPolicyRegistry";
import { verifyEnvironmentPolicyRegistry } from "./EnvironmentPolicyRegistry";
import type { ReleaseManifestV1 } from "./ReleaseManifest";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import { sha256Json } from "./BuildLedger";

export type GovernanceOperation =
  | "DEPLOY"
  | "IMPORT"
  | "EXECUTE"
  | "PROMOTE"
  | "PRODUCTION_RELEASE";

export type GovernanceSnapshotV1 = {
  schema: "goodle.governance-snapshot.v1";
  snapshot_id: string;
  registry_hash: string;
  operation: GovernanceOperation;
  source_environment?: string;
  destination_environment: string;
  environment_policy: EnvironmentPolicyV1;
  transition?: { from: string; to: string; allowed: boolean };
  target: TrustedArtifactBundleV1["attestation"]["target"];
  release_status?: ReleaseManifestV1["status"];
  policy_hash: string;
  snapshot_hash: string;
};

export function createGovernanceSnapshot(input: {
  registry: EnvironmentPolicyRegistryV1;
  operation: GovernanceOperation;
  destination_environment: string;
  target: TrustedArtifactBundleV1["attestation"]["target"];
  source_environment?: string;
  release_status?: ReleaseManifestV1["status"];
}): GovernanceSnapshotV1 {
  if (!verifyEnvironmentPolicyRegistry(input.registry)) {
    throw new Error("GOVERNANCE_REGISTRY_INTEGRITY_FAILED");
  }

  const environmentPolicy =
    input.registry.environments[input.destination_environment];

  if (!environmentPolicy) {
    throw new Error(
      `GOVERNANCE_ENVIRONMENT_POLICY_NOT_FOUND: ${input.destination_environment}`,
    );
  }

  const transition = input.source_environment
    ? {
        from: input.source_environment,
        to: input.destination_environment,
        allowed: input.registry.allowed_transitions.some(
          (candidate) =>
            candidate.from === input.source_environment &&
            candidate.to === input.destination_environment,
        ),
      }
    : undefined;

  const policy_hash = sha256Json({
    environment_policy: environmentPolicy,
    transition,
  });

  const unsigned = {
    schema: "goodle.governance-snapshot.v1" as const,
    registry_hash: input.registry.registry_hash,
    operation: input.operation,
    source_environment: input.source_environment,
    destination_environment: input.destination_environment,
    environment_policy: {
      ...environmentPolicy,
      allowed_adapters: [...environmentPolicy.allowed_adapters],
      allowed_kinds: [...environmentPolicy.allowed_kinds],
    },
    transition,
    target: { ...input.target },
    release_status: input.release_status,
    policy_hash,
  };

  const snapshot_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    snapshot_id: `governance-${snapshot_hash.slice(0, 16)}`,
    snapshot_hash,
  };
}

export function verifyGovernanceSnapshot(
  snapshot: GovernanceSnapshotV1,
): boolean {
  const {
    snapshot_id: _snapshotId,
    snapshot_hash,
    ...unsigned
  } = snapshot;

  return sha256Json(unsigned) === snapshot_hash;
}
