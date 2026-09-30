import type { ReleaseManifestV1 } from "./ReleaseManifest";
import { verifyReleaseManifest } from "./ReleaseManifest";
import type { PromotionReceiptV1 } from "./PromotionPipeline";
import { verifyPromotionReceipt } from "./PromotionPipeline";
import type { ProductionReleaseReceiptV1 } from "./ProductionReleaseGate";
import { verifyProductionReleaseReceipt } from "./ProductionReleaseGate";
import type { ProductionReleaseRollbackReceiptV1 } from "./ReleaseRollbackEnforcement";
import { verifyProductionReleaseRollbackReceipt } from "./ReleaseRollbackEnforcement";
import { sha256Json } from "./BuildLedger";

export type ReleaseRegistryEntryV1 = {
  release_id: string;
  version: string;
  status: ReleaseManifestV1["status"];
  logical_build_id: string;
  bundle_id: string;
  predecessor_release_id?: string;
  successor_release_id?: string;
};

export type ReleaseRegistryV1 = {
  schema: "goodle.release-registry.v1";
  entries: ReleaseRegistryEntryV1[];
  active_by_environment: Record<string, string | undefined>;
  promotion_receipts: string[];
  rollback_receipts: string[];
  registry_hash: string;
};

function withHash(input: Omit<ReleaseRegistryV1, "registry_hash">): ReleaseRegistryV1 {
  return {
    ...input,
    registry_hash: sha256Json(input),
  };
}

export function createReleaseRegistry(): ReleaseRegistryV1 {
  return withHash({
    schema: "goodle.release-registry.v1",
    entries: [],
    active_by_environment: {},
    promotion_receipts: [],
    rollback_receipts: [],
  });
}

export function verifyReleaseRegistry(registry: ReleaseRegistryV1): boolean {
  const { registry_hash, ...unsigned } = registry;
  return sha256Json(unsigned) === registry_hash;
}

export function registerRelease(
  registry: ReleaseRegistryV1,
  release: ReleaseManifestV1,
): ReleaseRegistryV1 {
  if (!verifyReleaseRegistry(registry)) {
    throw new Error("RELEASE_REGISTRY_INTEGRITY_FAILED");
  }
  if (!verifyReleaseManifest(release)) {
    throw new Error("RELEASE_REGISTRY_MANIFEST_INVALID");
  }

  const existing = registry.entries.find(
    (entry) => entry.release_id === release.release_id,
  );
  if (existing) {
    throw new Error(`RELEASE_ALREADY_REGISTERED: ${release.release_id}`);
  }

  const sameVersion = registry.entries.find(
    (entry) => entry.version === release.version,
  );
  if (sameVersion) {
    throw new Error(`RELEASE_VERSION_ALREADY_REGISTERED: ${release.version}`);
  }

  const previous = registry.entries.at(-1);

  const entries = registry.entries.map((entry, index) =>
    index === registry.entries.length - 1 && previous
      ? { ...entry, successor_release_id: release.release_id }
      : entry,
  );

  entries.push({
    release_id: release.release_id,
    version: release.version,
    status: release.status,
    logical_build_id: release.logical_build_id,
    bundle_id: release.bundle_id,
    predecessor_release_id: previous?.release_id,
  });

  return withHash({
    schema: registry.schema,
    entries,
    active_by_environment: { ...registry.active_by_environment },
    promotion_receipts: [...registry.promotion_receipts],
    rollback_receipts: [...registry.rollback_receipts],
  });
}

export function syncReleaseStatus(
  registry: ReleaseRegistryV1,
  release: ReleaseManifestV1,
): ReleaseRegistryV1 {
  if (!verifyReleaseRegistry(registry)) {
    throw new Error("RELEASE_REGISTRY_INTEGRITY_FAILED");
  }
  if (!verifyReleaseManifest(release)) {
    throw new Error("RELEASE_REGISTRY_MANIFEST_INVALID");
  }

  let found = false;
  const entries = registry.entries.map((entry) => {
    if (entry.version !== release.version) return entry;
    found = true;

    if (
      entry.logical_build_id !== release.logical_build_id ||
      entry.bundle_id !== release.bundle_id
    ) {
      throw new Error("RELEASE_REGISTRY_IDENTITY_DRIFT");
    }

    return {
      ...entry,
      release_id: release.release_id,
      status: release.status,
    };
  });

  if (!found) {
    throw new Error(`RELEASE_NOT_REGISTERED: ${release.version}`);
  }

  return withHash({
    schema: registry.schema,
    entries,
    active_by_environment: { ...registry.active_by_environment },
    promotion_receipts: [...registry.promotion_receipts],
    rollback_receipts: [...registry.rollback_receipts],
  });
}

export function recordPromotion(
  registry: ReleaseRegistryV1,
  receipt: PromotionReceiptV1,
): ReleaseRegistryV1 {
  if (!verifyReleaseRegistry(registry)) {
    throw new Error("RELEASE_REGISTRY_INTEGRITY_FAILED");
  }
  if (!verifyPromotionReceipt(receipt)) {
    throw new Error("RELEASE_REGISTRY_PROMOTION_RECEIPT_INVALID");
  }

  const target = registry.entries.find(
    (entry) =>
      entry.logical_build_id === receipt.logical_build_id &&
      entry.bundle_id === receipt.bundle_id,
  );
  if (!target) throw new Error("RELEASE_REGISTRY_PROMOTION_RELEASE_UNKNOWN");

  return withHash({
    schema: registry.schema,
    entries: [...registry.entries],
    active_by_environment: {
      ...registry.active_by_environment,
      [receipt.to_environment]: target.release_id,
    },
    promotion_receipts: [...registry.promotion_receipts, receipt.promotion_id],
    rollback_receipts: [...registry.rollback_receipts],
  });
}

export function recordProductionActivation(
  registry: ReleaseRegistryV1,
  receipt: ProductionReleaseReceiptV1,
): ReleaseRegistryV1 {
  if (!verifyReleaseRegistry(registry)) {
    throw new Error("RELEASE_REGISTRY_INTEGRITY_FAILED");
  }
  if (!verifyProductionReleaseReceipt(receipt)) {
    throw new Error("RELEASE_REGISTRY_PRODUCTION_RECEIPT_INVALID");
  }

  const release = registry.entries.find(
    (entry) => entry.release_id === receipt.release_id,
  );
  if (!release) throw new Error("RELEASE_REGISTRY_PRODUCTION_RELEASE_UNKNOWN");

  return withHash({
    schema: registry.schema,
    entries: [...registry.entries],
    active_by_environment: {
      ...registry.active_by_environment,
      [receipt.production_environment]: release.release_id,
    },
    promotion_receipts: [...registry.promotion_receipts],
    rollback_receipts: [...registry.rollback_receipts],
  });
}

export function recordProductionRollback(
  registry: ReleaseRegistryV1,
  receipt: ProductionReleaseRollbackReceiptV1,
): ReleaseRegistryV1 {
  if (!verifyReleaseRegistry(registry)) {
    throw new Error("RELEASE_REGISTRY_INTEGRITY_FAILED");
  }
  if (!verifyProductionReleaseRollbackReceipt(receipt)) {
    throw new Error("RELEASE_REGISTRY_ROLLBACK_RECEIPT_INVALID");
  }

  const target = registry.entries.find(
    (entry) => entry.release_id === receipt.to_release_id,
  );
  if (!target) throw new Error("RELEASE_REGISTRY_ROLLBACK_RELEASE_UNKNOWN");

  return withHash({
    schema: registry.schema,
    entries: [...registry.entries],
    active_by_environment: {
      ...registry.active_by_environment,
      production: target.release_id,
    },
    promotion_receipts: [...registry.promotion_receipts],
    rollback_receipts: [...registry.rollback_receipts, receipt.receipt_id],
  });
}
