import type { DistributionAuditPackageV1 } from "./DistributionAuditPackage";
import {
  verifyDistributionAuditPackage,
  type DistributionAuditPackageVerificationV1,
} from "./DistributionAuditPackage";
import type { EvidencePackageAdmissionTarget } from "./EvidencePackageConsumer";
import type { DistributionCapability } from "./DistributionAvailabilityGate";

export type ExternalAuditComplianceDecision =
  | "COMPLIANT"
  | "REVIEW_REQUIRED"
  | "NON_COMPLIANT";

export type ExternalAuditCompliancePolicyV1 = {
  require_no_revoked_targets?: boolean;
  require_active_targets?: EvidencePackageAdmissionTarget[];
  max_failed_operations?: number;
  max_failure_rate?: number;
  require_capability_usage?: DistributionCapability[];
  require_successful_execution?: boolean;
};

export type ExternalAuditComplianceResultV1 = {
  schema: "goodle.external-audit-compliance-result.v1";
  audit_package_id: string;
  package_id: string;
  decision: ExternalAuditComplianceDecision;
  acceptable: boolean;
  review_required: boolean;
  reasons: string[];
  verification: DistributionAuditPackageVerificationV1;
};

function failureRate(total: number, failed: number): number {
  if (total === 0) return 0;
  return failed / total;
}

export function evaluateExternalAuditCompliance(input: {
  audit: DistributionAuditPackageV1;
  policy?: ExternalAuditCompliancePolicyV1;
}): ExternalAuditComplianceResultV1 {
  const verification = verifyDistributionAuditPackage(input.audit);
  const reasons = [...verification.reasons];

  if (!verification.valid) {
    return {
      schema: "goodle.external-audit-compliance-result.v1",
      audit_package_id: input.audit.audit_package_id,
      package_id: input.audit.package_id,
      decision: "NON_COMPLIANT",
      acceptable: false,
      review_required: false,
      reasons,
      verification,
    };
  }

  const policy = input.policy ?? {};
  const registry = input.audit.distribution_registry;
  const metrics = input.audit.usage_attestation.metrics;

  if (
    policy.require_no_revoked_targets &&
    registry.revoked_targets.length > 0
  ) {
    reasons.push("REVOKED_DISTRIBUTION_TARGET_PRESENT");
  }

  if (policy.require_active_targets) {
    for (const target of policy.require_active_targets) {
      if (!registry.active_targets.includes(target)) {
        reasons.push(`REQUIRED_ACTIVE_TARGET_MISSING:${target}`);
      }
    }
  }

  if (
    policy.max_failed_operations !== undefined &&
    metrics.failed > policy.max_failed_operations
  ) {
    reasons.push("FAILED_OPERATION_LIMIT_EXCEEDED");
  }

  const observedFailureRate = failureRate(
    metrics.total_operations,
    metrics.failed,
  );

  if (
    policy.max_failure_rate !== undefined &&
    observedFailureRate > policy.max_failure_rate
  ) {
    reasons.push("FAILURE_RATE_LIMIT_EXCEEDED");
  }

  if (policy.require_capability_usage) {
    for (const capability of policy.require_capability_usage) {
      if (metrics.by_capability[capability] <= 0) {
        reasons.push(`REQUIRED_CAPABILITY_USAGE_MISSING:${capability}`);
      }
    }
  }

  if (
    policy.require_successful_execution &&
    !input.audit.usage_chronicle.entries.some(
      (entry) =>
        entry.capability === "EXECUTE" &&
        entry.status === "SUCCEEDED",
    )
  ) {
    reasons.push("SUCCESSFUL_EXECUTION_REQUIRED");
  }

  const reviewReasons = reasons.filter(
    (reason) =>
      reason.startsWith("REQUIRED_ACTIVE_TARGET_MISSING:") ||
      reason.startsWith("REQUIRED_CAPABILITY_USAGE_MISSING:") ||
      reason === "FAILED_OPERATION_LIMIT_EXCEEDED" ||
      reason === "FAILURE_RATE_LIMIT_EXCEEDED" ||
      reason === "SUCCESSFUL_EXECUTION_REQUIRED" ||
      reason === "REVOKED_DISTRIBUTION_TARGET_PRESENT",
  );

  const decision: ExternalAuditComplianceDecision =
    reviewReasons.length === 0 ? "COMPLIANT" : "REVIEW_REQUIRED";

  return {
    schema: "goodle.external-audit-compliance-result.v1",
    audit_package_id: input.audit.audit_package_id,
    package_id: input.audit.package_id,
    decision,
    acceptable: decision === "COMPLIANT",
    review_required: decision === "REVIEW_REQUIRED",
    reasons,
    verification,
  };
}

export function assertExternalAuditCompliant(
  result: ExternalAuditComplianceResultV1,
): void {
  if (!result.acceptable) {
    throw new Error(
      `EXTERNAL_AUDIT_NOT_COMPLIANT: ${result.decision}: ${result.reasons.join(",")}`,
    );
  }
}

export const STRICT_EXTERNAL_AUDIT_POLICY_V1: ExternalAuditCompliancePolicyV1 = {
  require_no_revoked_targets: true,
  max_failed_operations: 0,
  max_failure_rate: 0,
  require_successful_execution: true,
};
