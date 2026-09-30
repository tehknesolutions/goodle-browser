import type { EvidencePackageAdmissionTarget } from "./EvidencePackageConsumer";
import type {
  DistributionState,
  UnifiedDistributionRegistryV1,
} from "./UnifiedDistributionRegistry";
import {
  distributionStateFor,
  verifyUnifiedDistributionRegistry,
} from "./UnifiedDistributionRegistry";

export type DistributionCapability =
  | "DISCOVER"
  | "LOAD"
  | "EXECUTE";

export type DistributionAvailabilityPolicyV1 = {
  target: EvidencePackageAdmissionTarget;
  allowed_states: DistributionState[];
  allowed_capabilities: DistributionCapability[];
};

export type DistributionAvailabilityDecisionV1 = {
  schema: "goodle.distribution-availability-decision.v1";
  package_id: string;
  package_hash: string;
  target: EvidencePackageAdmissionTarget;
  state: DistributionState;
  capability: DistributionCapability;
  decision: "ALLOWED" | "BLOCKED";
  available: boolean;
  reason?: string;
};

export const DEFAULT_DISTRIBUTION_POLICIES_V1: readonly DistributionAvailabilityPolicyV1[] = [
  {
    target: "IMPORT",
    allowed_states: ["ACTIVE"],
    allowed_capabilities: ["DISCOVER", "LOAD"],
  },
  {
    target: "PUBLISH",
    allowed_states: ["ACTIVE"],
    allowed_capabilities: ["DISCOVER", "LOAD"],
  },
  {
    target: "MARKETPLACE",
    allowed_states: ["ACTIVE"],
    allowed_capabilities: ["DISCOVER", "LOAD"],
  },
  {
    target: "HNK_VERSE",
    allowed_states: ["ACTIVE"],
    allowed_capabilities: ["DISCOVER", "LOAD", "EXECUTE"],
  },
];

export function evaluateDistributionAvailability(input: {
  registry: UnifiedDistributionRegistryV1;
  target: EvidencePackageAdmissionTarget;
  capability: DistributionCapability;
  policies?: readonly DistributionAvailabilityPolicyV1[];
}): DistributionAvailabilityDecisionV1 {
  if (!verifyUnifiedDistributionRegistry(input.registry)) {
    throw new Error("DISTRIBUTION_AVAILABILITY_REGISTRY_INVALID");
  }

  const policies = input.policies ?? DEFAULT_DISTRIBUTION_POLICIES_V1;
  const policy = policies.find((entry) => entry.target === input.target);

  if (!policy) {
    return {
      schema: "goodle.distribution-availability-decision.v1",
      package_id: input.registry.package_id,
      package_hash: input.registry.package_hash,
      target: input.target,
      state: distributionStateFor(input.registry, input.target),
      capability: input.capability,
      decision: "BLOCKED",
      available: false,
      reason: "DISTRIBUTION_POLICY_NOT_FOUND",
    };
  }

  const state = distributionStateFor(input.registry, input.target);

  if (!policy.allowed_states.includes(state)) {
    return {
      schema: "goodle.distribution-availability-decision.v1",
      package_id: input.registry.package_id,
      package_hash: input.registry.package_hash,
      target: input.target,
      state,
      capability: input.capability,
      decision: "BLOCKED",
      available: false,
      reason:
        state === "REVOKED"
          ? "DISTRIBUTION_TARGET_REVOKED"
          : "DISTRIBUTION_TARGET_UNPUBLISHED",
    };
  }

  if (!policy.allowed_capabilities.includes(input.capability)) {
    return {
      schema: "goodle.distribution-availability-decision.v1",
      package_id: input.registry.package_id,
      package_hash: input.registry.package_hash,
      target: input.target,
      state,
      capability: input.capability,
      decision: "BLOCKED",
      available: false,
      reason: "DISTRIBUTION_CAPABILITY_NOT_ALLOWED",
    };
  }

  return {
    schema: "goodle.distribution-availability-decision.v1",
    package_id: input.registry.package_id,
    package_hash: input.registry.package_hash,
    target: input.target,
    state,
    capability: input.capability,
    decision: "ALLOWED",
    available: true,
  };
}

export function assertDistributionAvailable(
  decision: DistributionAvailabilityDecisionV1,
): void {
  if (!decision.available) {
    throw new Error(
      `DISTRIBUTION_NOT_AVAILABLE: ${decision.target}:${decision.capability}:${decision.reason ?? "BLOCKED"}`,
    );
  }
}
