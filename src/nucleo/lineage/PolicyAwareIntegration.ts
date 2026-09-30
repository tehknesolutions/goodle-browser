import type { EnvironmentStateV1 } from "./DeploymentChronicle";
import type {
  EnvironmentPolicyRegistryV1,
} from "./EnvironmentPolicyRegistry";
import {
  assertEnvironmentTransitionAllowed,
  assertReleaseRequirementForEnvironment,
  getTrustedBundlePolicyForEnvironment,
} from "./EnvironmentPolicyRegistry";
import {
  authorizeTrustedDeployment,
  type TrustedDeploymentAction,
  type TrustedDeploymentReceiptV1,
} from "./TrustedDeploymentGate";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import {
  promoteTrustedBuild,
  type PromotionReceiptV1,
} from "./PromotionPipeline";
import type {
  ProductionEnvironmentStateV1,
  ProductionReleaseReceiptV1,
} from "./ProductionReleaseGate";
import { promoteReleasedBuildToProduction } from "./ProductionReleaseGate";
import type { ReleaseManifestV1 } from "./ReleaseManifest";
import {
  createGovernanceSnapshot,
  type GovernanceSnapshotV1,
} from "./GovernanceSnapshot";

export function authorizePolicyAwareDeployment(input: {
  registry: EnvironmentPolicyRegistryV1;
  action: TrustedDeploymentAction;
  environment: string;
  bundle: TrustedArtifactBundleV1;
  release_status?: ReleaseManifestV1["status"];
}): TrustedDeploymentReceiptV1 {
  const policy = getTrustedBundlePolicyForEnvironment(
    input.registry,
    input.environment,
    input.bundle.attestation.target,
  );

  assertReleaseRequirementForEnvironment(
    input.registry,
    input.environment,
    input.release_status,
  );

  return authorizeTrustedDeployment({
    action: input.action,
    environment: input.environment,
    bundle: input.bundle,
    policy,
  });
}

export function authorizeAttestedPolicyAwareDeployment(input: {
  registry: EnvironmentPolicyRegistryV1;
  action: TrustedDeploymentAction;
  environment: string;
  bundle: TrustedArtifactBundleV1;
  release_status?: ReleaseManifestV1["status"];
}): {
  deployment_receipt: TrustedDeploymentReceiptV1;
  governance_snapshot: GovernanceSnapshotV1;
} {
  const governance_snapshot = createGovernanceSnapshot({
    registry: input.registry,
    operation: input.action,
    destination_environment: input.environment,
    target: input.bundle.attestation.target,
    release_status: input.release_status,
  });

  const deployment_receipt = authorizePolicyAwareDeployment(input);

  return {
    deployment_receipt,
    governance_snapshot,
  };
}

export function promotePolicyAwareTrustedBuild(input: {
  registry: EnvironmentPolicyRegistryV1;
  source: EnvironmentStateV1;
  destination: EnvironmentStateV1;
  bundle: TrustedArtifactBundleV1;
}): {
  destination: EnvironmentStateV1;
  deployment_receipt: TrustedDeploymentReceiptV1;
  promotion_receipt: PromotionReceiptV1;
} {
  assertEnvironmentTransitionAllowed(
    input.registry,
    input.source.environment,
    input.destination.environment,
  );

  const destinationPolicy = getTrustedBundlePolicyForEnvironment(
    input.registry,
    input.destination.environment,
    input.bundle.attestation.target,
  );

  assertReleaseRequirementForEnvironment(
    input.registry,
    input.destination.environment,
    undefined,
  );

  return promoteTrustedBuild({
    source: input.source,
    destination: input.destination,
    bundle: input.bundle,
    policy: {
      allowed_transitions: [{
        from: input.source.environment,
        to: input.destination.environment,
      }],
      destination_policy: destinationPolicy,
    },
  });
}

export function promoteAttestedPolicyAwareTrustedBuild(input: {
  registry: EnvironmentPolicyRegistryV1;
  source: EnvironmentStateV1;
  destination: EnvironmentStateV1;
  bundle: TrustedArtifactBundleV1;
}): {
  destination: EnvironmentStateV1;
  deployment_receipt: TrustedDeploymentReceiptV1;
  promotion_receipt: PromotionReceiptV1;
  governance_snapshot: GovernanceSnapshotV1;
} {
  const governance_snapshot = createGovernanceSnapshot({
    registry: input.registry,
    operation: "PROMOTE",
    source_environment: input.source.environment,
    destination_environment: input.destination.environment,
    target: input.bundle.attestation.target,
  });

  return {
    ...promotePolicyAwareTrustedBuild(input),
    governance_snapshot,
  };
}

export function promotePolicyAwareReleasedBuildToProduction(input: {
  registry: EnvironmentPolicyRegistryV1;
  source: EnvironmentStateV1;
  production: ProductionEnvironmentStateV1;
  bundle: TrustedArtifactBundleV1;
  release: ReleaseManifestV1;
}): {
  production: ProductionEnvironmentStateV1;
  production_release_receipt: ProductionReleaseReceiptV1;
} {
  assertEnvironmentTransitionAllowed(
    input.registry,
    input.source.environment,
    input.production.environment,
  );

  const destinationPolicy = getTrustedBundlePolicyForEnvironment(
    input.registry,
    input.production.environment,
    input.bundle.attestation.target,
  );

  assertReleaseRequirementForEnvironment(
    input.registry,
    input.production.environment,
    input.release.status,
  );

  return promoteReleasedBuildToProduction({
    source: input.source,
    production: input.production,
    bundle: input.bundle,
    release: input.release,
    promotion_policy_override: {
      allowed_transitions: [{
        from: input.source.environment,
        to: input.production.environment,
      }],
      destination_policy: destinationPolicy,
    },
  });
}

export function promoteAttestedPolicyAwareReleasedBuildToProduction(input: {
  registry: EnvironmentPolicyRegistryV1;
  source: EnvironmentStateV1;
  production: ProductionEnvironmentStateV1;
  bundle: TrustedArtifactBundleV1;
  release: ReleaseManifestV1;
}): {
  production: ProductionEnvironmentStateV1;
  production_release_receipt: ProductionReleaseReceiptV1;
  governance_snapshot: GovernanceSnapshotV1;
} {
  const governance_snapshot = createGovernanceSnapshot({
    registry: input.registry,
    operation: "PRODUCTION_RELEASE",
    source_environment: input.source.environment,
    destination_environment: input.production.environment,
    target: input.bundle.attestation.target,
    release_status: input.release.status,
  });

  return {
    ...promotePolicyAwareReleasedBuildToProduction(input),
    governance_snapshot,
  };
}
