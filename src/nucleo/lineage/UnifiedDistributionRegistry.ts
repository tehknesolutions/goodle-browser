import type { EvidencePackageAdmissionTarget } from "./EvidencePackageConsumer";
import type { PublicationLifecycleLedgerV1 } from "./PublicationLifecycleLedger";
import {
  deriveCurrentPublicationLifecycleState,
  verifyPublicationLifecycleLedger,
} from "./PublicationLifecycleLedger";
import { sha256Json } from "./BuildLedger";

export type DistributionState =
  | "ACTIVE"
  | "REVOKED"
  | "UNPUBLISHED";

export type DistributionChannelStateV1 = {
  target: EvidencePackageAdmissionTarget;
  state: DistributionState;
  registry_ref?: string;
  lifecycle_ledger_hash?: string;
};

export type UnifiedDistributionRegistryV1 = {
  schema: "goodle.unified-distribution-registry.v1";
  package_id: string;
  package_hash: string;
  channels: DistributionChannelStateV1[];
  active_targets: EvidencePackageAdmissionTarget[];
  revoked_targets: EvidencePackageAdmissionTarget[];
  unpublished_targets: EvidencePackageAdmissionTarget[];
  registry_hash: string;
};

const TARGETS: readonly EvidencePackageAdmissionTarget[] = [
  "IMPORT",
  "PUBLISH",
  "MARKETPLACE",
  "HNK_VERSE",
] as const;

function emptyChannel(
  target: EvidencePackageAdmissionTarget,
): DistributionChannelStateV1 {
  return {
    target,
    state: "UNPUBLISHED",
  };
}

export function createUnifiedDistributionRegistry(input: {
  package_id: string;
  package_hash: string;
  lifecycle_ledgers: PublicationLifecycleLedgerV1[];
}): UnifiedDistributionRegistryV1 {
  if (!input.package_id.trim()) {
    throw new Error("DISTRIBUTION_PACKAGE_ID_REQUIRED");
  }
  if (!input.package_hash.trim()) {
    throw new Error("DISTRIBUTION_PACKAGE_HASH_REQUIRED");
  }

  const byTarget = new Map<
    EvidencePackageAdmissionTarget,
    DistributionChannelStateV1
  >();

  for (const target of TARGETS) {
    byTarget.set(target, emptyChannel(target));
  }

  for (const ledger of input.lifecycle_ledgers) {
    if (!verifyPublicationLifecycleLedger(ledger)) {
      throw new Error("DISTRIBUTION_LIFECYCLE_LEDGER_INVALID");
    }

    const first = ledger.entries[0];
    if (!first) continue;

    if (
      first.package_id !== input.package_id ||
      first.package_hash !== input.package_hash
    ) {
      throw new Error("DISTRIBUTION_PACKAGE_IDENTITY_MISMATCH");
    }

    if (byTarget.get(first.target)?.state !== "UNPUBLISHED") {
      throw new Error("DISTRIBUTION_DUPLICATE_TARGET_LEDGER");
    }

    byTarget.set(first.target, {
      target: first.target,
      state: deriveCurrentPublicationLifecycleState(ledger),
      registry_ref: first.registry_ref,
      lifecycle_ledger_hash: ledger.ledger_hash,
    });
  }

  const channels = TARGETS.map((target) => byTarget.get(target)!);
  const active_targets = channels
    .filter((channel) => channel.state === "ACTIVE")
    .map((channel) => channel.target);
  const revoked_targets = channels
    .filter((channel) => channel.state === "REVOKED")
    .map((channel) => channel.target);
  const unpublished_targets = channels
    .filter((channel) => channel.state === "UNPUBLISHED")
    .map((channel) => channel.target);

  const unsigned = {
    schema: "goodle.unified-distribution-registry.v1" as const,
    package_id: input.package_id,
    package_hash: input.package_hash,
    channels,
    active_targets,
    revoked_targets,
    unpublished_targets,
  };

  return {
    ...unsigned,
    registry_hash: sha256Json(unsigned),
  };
}

export function verifyUnifiedDistributionRegistry(
  registry: UnifiedDistributionRegistryV1,
): boolean {
  if (registry.channels.length !== TARGETS.length) return false;

  const seen = new Set<EvidencePackageAdmissionTarget>();
  for (const channel of registry.channels) {
    if (seen.has(channel.target)) return false;
    seen.add(channel.target);

    if (
      channel.state === "UNPUBLISHED" &&
      (channel.registry_ref || channel.lifecycle_ledger_hash)
    ) {
      return false;
    }

    if (
      channel.state !== "UNPUBLISHED" &&
      (!channel.registry_ref || !channel.lifecycle_ledger_hash)
    ) {
      return false;
    }
  }

  if (!TARGETS.every((target) => seen.has(target))) return false;

  const active = registry.channels
    .filter((channel) => channel.state === "ACTIVE")
    .map((channel) => channel.target);
  const revoked = registry.channels
    .filter((channel) => channel.state === "REVOKED")
    .map((channel) => channel.target);
  const unpublished = registry.channels
    .filter((channel) => channel.state === "UNPUBLISHED")
    .map((channel) => channel.target);

  if (JSON.stringify(active) !== JSON.stringify(registry.active_targets)) return false;
  if (JSON.stringify(revoked) !== JSON.stringify(registry.revoked_targets)) return false;
  if (
    JSON.stringify(unpublished) !==
    JSON.stringify(registry.unpublished_targets)
  ) {
    return false;
  }

  const {
    registry_hash,
    ...unsigned
  } = registry;

  return sha256Json(unsigned) === registry_hash;
}

export function distributionStateFor(
  registry: UnifiedDistributionRegistryV1,
  target: EvidencePackageAdmissionTarget,
): DistributionState {
  if (!verifyUnifiedDistributionRegistry(registry)) {
    throw new Error("DISTRIBUTION_REGISTRY_INTEGRITY_FAILED");
  }

  return (
    registry.channels.find((channel) => channel.target === target)?.state ??
    "UNPUBLISHED"
  );
}
