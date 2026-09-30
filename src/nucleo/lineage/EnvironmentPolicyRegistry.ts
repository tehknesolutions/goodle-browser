import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import type { TrustedBundlePolicy } from "./TrustedBundleConsumer";
import { sha256Json } from "./BuildLedger";

export type EnvironmentPolicyV1 = {
  environment: string;
  require_certified: boolean;
  allow_partial: boolean;
  allowed_adapters: string[];
  allowed_kinds: Array<TrustedArtifactBundleV1["attestation"]["target"]["kind"]>;
  require_released_manifest: boolean;
};

export type EnvironmentTransitionPolicyV1 = {
  from: string;
  to: string;
};

export type EnvironmentPolicyRegistryV1 = {
  schema: "goodle.environment-policy-registry.v1";
  environments: Record<string, EnvironmentPolicyV1>;
  allowed_transitions: EnvironmentTransitionPolicyV1[];
  registry_hash: string;
};

function withHash(
  input: Omit<EnvironmentPolicyRegistryV1, "registry_hash">,
): EnvironmentPolicyRegistryV1 {
  return {
    ...input,
    registry_hash: sha256Json(input),
  };
}

export function createEnvironmentPolicyRegistry(): EnvironmentPolicyRegistryV1 {
  return withHash({
    schema: "goodle.environment-policy-registry.v1",
    environments: {},
    allowed_transitions: [],
  });
}

export function verifyEnvironmentPolicyRegistry(
  registry: EnvironmentPolicyRegistryV1,
): boolean {
  const { registry_hash, ...unsigned } = registry;
  return sha256Json(unsigned) === registry_hash;
}

export function registerEnvironmentPolicy(
  registry: EnvironmentPolicyRegistryV1,
  policy: EnvironmentPolicyV1,
): EnvironmentPolicyRegistryV1 {
  if (!verifyEnvironmentPolicyRegistry(registry)) {
    throw new Error("ENVIRONMENT_POLICY_REGISTRY_INTEGRITY_FAILED");
  }
  if (!policy.environment.trim()) {
    throw new Error("ENVIRONMENT_POLICY_NAME_REQUIRED");
  }

  return withHash({
    schema: registry.schema,
    environments: {
      ...registry.environments,
      [policy.environment]: {
        ...policy,
        allowed_adapters: [...new Set(policy.allowed_adapters)].sort(),
        allowed_kinds: [...new Set(policy.allowed_kinds)].sort(),
      },
    },
    allowed_transitions: [...registry.allowed_transitions],
  });
}

export function allowEnvironmentTransition(
  registry: EnvironmentPolicyRegistryV1,
  transition: EnvironmentTransitionPolicyV1,
): EnvironmentPolicyRegistryV1 {
  if (!verifyEnvironmentPolicyRegistry(registry)) {
    throw new Error("ENVIRONMENT_POLICY_REGISTRY_INTEGRITY_FAILED");
  }
  if (!registry.environments[transition.from]) {
    throw new Error(`ENVIRONMENT_POLICY_SOURCE_UNKNOWN: ${transition.from}`);
  }
  if (!registry.environments[transition.to]) {
    throw new Error(`ENVIRONMENT_POLICY_DESTINATION_UNKNOWN: ${transition.to}`);
  }

  const exists = registry.allowed_transitions.some(
    (candidate) =>
      candidate.from === transition.from && candidate.to === transition.to,
  );

  return withHash({
    schema: registry.schema,
    environments: { ...registry.environments },
    allowed_transitions: exists
      ? [...registry.allowed_transitions]
      : [...registry.allowed_transitions, transition],
  });
}

export function getTrustedBundlePolicyForEnvironment(
  registry: EnvironmentPolicyRegistryV1,
  environment: string,
  target: TrustedArtifactBundleV1["attestation"]["target"],
): TrustedBundlePolicy {
  if (!verifyEnvironmentPolicyRegistry(registry)) {
    throw new Error("ENVIRONMENT_POLICY_REGISTRY_INTEGRITY_FAILED");
  }

  const policy = registry.environments[environment];
  if (!policy) {
    throw new Error(`ENVIRONMENT_POLICY_NOT_FOUND: ${environment}`);
  }

  if (!policy.allowed_adapters.includes(target.adapter)) {
    throw new Error(`ENVIRONMENT_ADAPTER_NOT_ALLOWED: ${target.adapter}`);
  }
  if (!policy.allowed_kinds.includes(target.kind)) {
    throw new Error(`ENVIRONMENT_KIND_NOT_ALLOWED: ${target.kind}`);
  }

  return {
    require_certified: policy.require_certified,
    allow_partial: policy.allow_partial,
    expected_adapter: target.adapter,
    expected_kind: target.kind,
  };
}

export function assertEnvironmentTransitionAllowed(
  registry: EnvironmentPolicyRegistryV1,
  from: string,
  to: string,
): void {
  if (!verifyEnvironmentPolicyRegistry(registry)) {
    throw new Error("ENVIRONMENT_POLICY_REGISTRY_INTEGRITY_FAILED");
  }

  const allowed = registry.allowed_transitions.some(
    (transition) => transition.from === from && transition.to === to,
  );
  if (!allowed) {
    throw new Error(`ENVIRONMENT_TRANSITION_NOT_ALLOWED: ${from} -> ${to}`);
  }
}

export function assertReleaseRequirementForEnvironment(
  registry: EnvironmentPolicyRegistryV1,
  environment: string,
  releaseStatus?: "RC" | "RELEASED" | "REVOKED",
): void {
  if (!verifyEnvironmentPolicyRegistry(registry)) {
    throw new Error("ENVIRONMENT_POLICY_REGISTRY_INTEGRITY_FAILED");
  }

  const policy = registry.environments[environment];
  if (!policy) {
    throw new Error(`ENVIRONMENT_POLICY_NOT_FOUND: ${environment}`);
  }

  if (policy.require_released_manifest && releaseStatus !== "RELEASED") {
    throw new Error(
      `ENVIRONMENT_REQUIRES_RELEASED_MANIFEST: ${environment}`,
    );
  }
}
