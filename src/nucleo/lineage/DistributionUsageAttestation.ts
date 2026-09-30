import type {
  DistributionUsageChronicleV1,
  DistributionUsageChronicleEntryV1,
} from "./DistributionAccessChronicle";
import { verifyDistributionUsageChronicle } from "./DistributionAccessChronicle";
import type { UnifiedDistributionRegistryV1 } from "./UnifiedDistributionRegistry";
import { verifyUnifiedDistributionRegistry } from "./UnifiedDistributionRegistry";
import type { EvidencePackageAdmissionTarget } from "./EvidencePackageConsumer";
import type { DistributionCapability } from "./DistributionAvailabilityGate";
import { sha256Json } from "./BuildLedger";

export type DistributionUsageMetricsV1 = {
  total_operations: number;
  succeeded: number;
  failed: number;
  by_target: Record<EvidencePackageAdmissionTarget, number>;
  by_capability: Record<DistributionCapability, number>;
};

export type DistributionUsageAttestationV1 = {
  schema: "goodle.distribution-usage-attestation.v1";
  attestation_id: string;
  package_id: string;
  package_hash: string;
  distribution_registry_hash: string;
  usage_chronicle_hash: string;
  usage_chronicle_head_hash?: string;
  metrics: DistributionUsageMetricsV1;
  active_targets_at_attestation: EvidencePackageAdmissionTarget[];
  revoked_targets_at_attestation: EvidencePackageAdmissionTarget[];
  unpublished_targets_at_attestation: EvidencePackageAdmissionTarget[];
  attestation_hash: string;
};

function emptyTargetCounts(): Record<EvidencePackageAdmissionTarget, number> {
  return {
    IMPORT: 0,
    PUBLISH: 0,
    MARKETPLACE: 0,
    HNK_VERSE: 0,
  };
}

function emptyCapabilityCounts(): Record<DistributionCapability, number> {
  return {
    DISCOVER: 0,
    LOAD: 0,
    EXECUTE: 0,
  };
}

function deriveMetrics(
  entries: DistributionUsageChronicleEntryV1[],
): DistributionUsageMetricsV1 {
  const by_target = emptyTargetCounts();
  const by_capability = emptyCapabilityCounts();

  let succeeded = 0;
  let failed = 0;

  for (const entry of entries) {
    by_target[entry.target] += 1;
    by_capability[entry.capability] += 1;

    if (entry.status === "SUCCEEDED") succeeded += 1;
    else failed += 1;
  }

  return {
    total_operations: entries.length,
    succeeded,
    failed,
    by_target,
    by_capability,
  };
}

export function createDistributionUsageAttestation(input: {
  registry: UnifiedDistributionRegistryV1;
  chronicle: DistributionUsageChronicleV1;
}): DistributionUsageAttestationV1 {
  if (!verifyUnifiedDistributionRegistry(input.registry)) {
    throw new Error("DISTRIBUTION_USAGE_ATTESTATION_REGISTRY_INVALID");
  }
  if (!verifyDistributionUsageChronicle(input.chronicle)) {
    throw new Error("DISTRIBUTION_USAGE_ATTESTATION_CHRONICLE_INVALID");
  }

  for (const entry of input.chronicle.entries) {
    if (
      entry.package_id !== input.registry.package_id ||
      entry.package_hash !== input.registry.package_hash
    ) {
      throw new Error("DISTRIBUTION_USAGE_ATTESTATION_PACKAGE_MISMATCH");
    }
  }

  const metrics = deriveMetrics(input.chronicle.entries);

  const unsigned = {
    schema: "goodle.distribution-usage-attestation.v1" as const,
    package_id: input.registry.package_id,
    package_hash: input.registry.package_hash,
    distribution_registry_hash: input.registry.registry_hash,
    usage_chronicle_hash: input.chronicle.chronicle_hash,
    usage_chronicle_head_hash: input.chronicle.head_hash,
    metrics,
    active_targets_at_attestation: [...input.registry.active_targets],
    revoked_targets_at_attestation: [...input.registry.revoked_targets],
    unpublished_targets_at_attestation: [...input.registry.unpublished_targets],
  };

  const attestation_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    attestation_id: `distribution-usage-${attestation_hash.slice(0, 16)}`,
    attestation_hash,
  };
}

export function verifyDistributionUsageAttestation(input: {
  attestation: DistributionUsageAttestationV1;
  registry: UnifiedDistributionRegistryV1;
  chronicle: DistributionUsageChronicleV1;
}): boolean {
  if (!verifyUnifiedDistributionRegistry(input.registry)) return false;
  if (!verifyDistributionUsageChronicle(input.chronicle)) return false;

  const expectedMetrics = deriveMetrics(input.chronicle.entries);

  const {
    attestation_id: _attestationId,
    attestation_hash,
    ...unsigned
  } = input.attestation;

  return (
    input.attestation.package_id === input.registry.package_id &&
    input.attestation.package_hash === input.registry.package_hash &&
    input.attestation.distribution_registry_hash === input.registry.registry_hash &&
    input.attestation.usage_chronicle_hash === input.chronicle.chronicle_hash &&
    input.attestation.usage_chronicle_head_hash === input.chronicle.head_hash &&
    JSON.stringify(input.attestation.metrics) === JSON.stringify(expectedMetrics) &&
    JSON.stringify(input.attestation.active_targets_at_attestation) ===
      JSON.stringify(input.registry.active_targets) &&
    JSON.stringify(input.attestation.revoked_targets_at_attestation) ===
      JSON.stringify(input.registry.revoked_targets) &&
    JSON.stringify(input.attestation.unpublished_targets_at_attestation) ===
      JSON.stringify(input.registry.unpublished_targets) &&
    sha256Json(unsigned) === attestation_hash
  );
}
