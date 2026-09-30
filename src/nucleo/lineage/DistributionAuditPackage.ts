import type { PublicationLifecycleLedgerV1 } from "./PublicationLifecycleLedger";
import { verifyPublicationLifecycleLedger } from "./PublicationLifecycleLedger";
import type { UnifiedDistributionRegistryV1 } from "./UnifiedDistributionRegistry";
import { verifyUnifiedDistributionRegistry } from "./UnifiedDistributionRegistry";
import type { DistributionUsageChronicleV1 } from "./DistributionAccessChronicle";
import { verifyDistributionUsageChronicle } from "./DistributionAccessChronicle";
import type { DistributionUsageAttestationV1 } from "./DistributionUsageAttestation";
import { verifyDistributionUsageAttestation } from "./DistributionUsageAttestation";
import { sha256Json } from "./BuildLedger";

export type DistributionAuditPackageV1 = {
  schema: "goodle.distribution-audit-package.v1";
  audit_package_id: string;
  package_id: string;
  package_hash: string;
  lifecycle_ledgers: PublicationLifecycleLedgerV1[];
  distribution_registry: UnifiedDistributionRegistryV1;
  usage_chronicle: DistributionUsageChronicleV1;
  usage_attestation: DistributionUsageAttestationV1;
  audit_package_hash: string;
};

export type DistributionAuditPackageVerificationV1 = {
  schema: "goodle.distribution-audit-package-verification.v1";
  valid: boolean;
  checks: {
    lifecycle_ledgers: boolean;
    distribution_registry: boolean;
    usage_chronicle: boolean;
    usage_attestation: boolean;
    lifecycle_registry_links: boolean;
    package_identity: boolean;
    audit_package_hash: boolean;
  };
  reasons: string[];
};

function lifecycleRegistryLinksValid(input: {
  ledgers: PublicationLifecycleLedgerV1[];
  registry: UnifiedDistributionRegistryV1;
}): boolean {
  for (const ledger of input.ledgers) {
    const first = ledger.entries[0];
    if (!first) continue;

    const channel = input.registry.channels.find(
      (candidate) => candidate.target === first.target,
    );

    if (
      !channel ||
      channel.lifecycle_ledger_hash !== ledger.ledger_hash ||
      channel.registry_ref !== first.registry_ref ||
      channel.state !== (ledger.current_state ?? "UNPUBLISHED")
    ) {
      return false;
    }
  }

  for (const channel of input.registry.channels) {
    if (channel.state === "UNPUBLISHED") continue;

    const ledger = input.ledgers.find(
      (candidate) => candidate.entries[0]?.target === channel.target,
    );

    if (!ledger || ledger.ledger_hash !== channel.lifecycle_ledger_hash) {
      return false;
    }
  }

  return true;
}

export function createDistributionAuditPackage(input: {
  lifecycle_ledgers: PublicationLifecycleLedgerV1[];
  distribution_registry: UnifiedDistributionRegistryV1;
  usage_chronicle: DistributionUsageChronicleV1;
  usage_attestation: DistributionUsageAttestationV1;
}): DistributionAuditPackageV1 {
  if (!input.lifecycle_ledgers.every(verifyPublicationLifecycleLedger)) {
    throw new Error("DISTRIBUTION_AUDIT_LIFECYCLE_LEDGER_INVALID");
  }
  if (!verifyUnifiedDistributionRegistry(input.distribution_registry)) {
    throw new Error("DISTRIBUTION_AUDIT_REGISTRY_INVALID");
  }
  if (!verifyDistributionUsageChronicle(input.usage_chronicle)) {
    throw new Error("DISTRIBUTION_AUDIT_USAGE_CHRONICLE_INVALID");
  }
  if (
    !verifyDistributionUsageAttestation({
      attestation: input.usage_attestation,
      registry: input.distribution_registry,
      chronicle: input.usage_chronicle,
    })
  ) {
    throw new Error("DISTRIBUTION_AUDIT_USAGE_ATTESTATION_INVALID");
  }
  if (
    !lifecycleRegistryLinksValid({
      ledgers: input.lifecycle_ledgers,
      registry: input.distribution_registry,
    })
  ) {
    throw new Error("DISTRIBUTION_AUDIT_LIFECYCLE_REGISTRY_MISMATCH");
  }

  const packageIdentityValid =
    input.lifecycle_ledgers.every((ledger) => {
      const first = ledger.entries[0];
      return (
        !first ||
        (
          first.package_id === input.distribution_registry.package_id &&
          first.package_hash === input.distribution_registry.package_hash
        )
      );
    }) &&
    input.usage_attestation.package_id === input.distribution_registry.package_id &&
    input.usage_attestation.package_hash === input.distribution_registry.package_hash;

  if (!packageIdentityValid) {
    throw new Error("DISTRIBUTION_AUDIT_PACKAGE_IDENTITY_MISMATCH");
  }

  const unsigned = {
    schema: "goodle.distribution-audit-package.v1" as const,
    package_id: input.distribution_registry.package_id,
    package_hash: input.distribution_registry.package_hash,
    lifecycle_ledgers: input.lifecycle_ledgers,
    distribution_registry: input.distribution_registry,
    usage_chronicle: input.usage_chronicle,
    usage_attestation: input.usage_attestation,
  };

  const audit_package_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    audit_package_id: `distribution-audit-${audit_package_hash.slice(0, 16)}`,
    audit_package_hash,
  };
}

export function verifyDistributionAuditPackage(
  audit: DistributionAuditPackageV1,
): DistributionAuditPackageVerificationV1 {
  const reasons: string[] = [];

  const lifecycle_ledgers = audit.lifecycle_ledgers.every(
    verifyPublicationLifecycleLedger,
  );
  const distribution_registry = verifyUnifiedDistributionRegistry(
    audit.distribution_registry,
  );
  const usage_chronicle = verifyDistributionUsageChronicle(
    audit.usage_chronicle,
  );
  const usage_attestation =
    distribution_registry &&
    usage_chronicle &&
    verifyDistributionUsageAttestation({
      attestation: audit.usage_attestation,
      registry: audit.distribution_registry,
      chronicle: audit.usage_chronicle,
    });

  const lifecycle_registry_links =
    lifecycle_ledgers &&
    distribution_registry &&
    lifecycleRegistryLinksValid({
      ledgers: audit.lifecycle_ledgers,
      registry: audit.distribution_registry,
    });

  const package_identity =
    audit.package_id === audit.distribution_registry.package_id &&
    audit.package_hash === audit.distribution_registry.package_hash &&
    audit.usage_attestation.package_id === audit.package_id &&
    audit.usage_attestation.package_hash === audit.package_hash &&
    audit.lifecycle_ledgers.every((ledger) => {
      const first = ledger.entries[0];
      return (
        !first ||
        (
          first.package_id === audit.package_id &&
          first.package_hash === audit.package_hash
        )
      );
    });

  if (!lifecycle_ledgers) reasons.push("LIFECYCLE_LEDGER_INVALID");
  if (!distribution_registry) reasons.push("DISTRIBUTION_REGISTRY_INVALID");
  if (!usage_chronicle) reasons.push("USAGE_CHRONICLE_INVALID");
  if (!usage_attestation) reasons.push("USAGE_ATTESTATION_INVALID");
  if (!lifecycle_registry_links) reasons.push("LIFECYCLE_REGISTRY_LINK_INVALID");
  if (!package_identity) reasons.push("DISTRIBUTION_AUDIT_PACKAGE_IDENTITY_INVALID");

  const {
    audit_package_id: _auditPackageId,
    audit_package_hash,
    ...unsigned
  } = audit;

  const audit_package_hash_valid =
    sha256Json(unsigned) === audit_package_hash;

  if (!audit_package_hash_valid) {
    reasons.push("DISTRIBUTION_AUDIT_PACKAGE_HASH_INVALID");
  }

  return {
    schema: "goodle.distribution-audit-package-verification.v1",
    valid:
      lifecycle_ledgers &&
      distribution_registry &&
      usage_chronicle &&
      usage_attestation &&
      lifecycle_registry_links &&
      package_identity &&
      audit_package_hash_valid,
    checks: {
      lifecycle_ledgers,
      distribution_registry,
      usage_chronicle,
      usage_attestation,
      lifecycle_registry_links,
      package_identity,
      audit_package_hash: audit_package_hash_valid,
    },
    reasons,
  };
}
