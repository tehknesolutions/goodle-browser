import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import { verifyTrustedArtifactBundle } from "./TrustedArtifactBundle";

export type SecurityHardeningPolicyV1 = {
  max_files: number;
  max_total_bytes: number;
  max_single_file_bytes: number;
  require_file_provenance: boolean;
};

export type SecurityHardeningReportV1 = {
  schema: "goodle.security-hardening-report.v1";
  status: "HARDENED" | "BLOCKED";
  bundle_id: string;
  checks: {
    bundle_integrity: boolean;
    path_safety: boolean;
    file_count: boolean;
    total_bytes: boolean;
    single_file_bytes: boolean;
    provenance: boolean;
  };
  metrics: {
    file_count: number;
    total_bytes: number;
    largest_file_bytes: number;
  };
  reasons: string[];
};

export const DEFAULT_SECURITY_HARDENING_POLICY: SecurityHardeningPolicyV1 = {
  max_files: 1000,
  max_total_bytes: 20 * 1024 * 1024,
  max_single_file_bytes: 5 * 1024 * 1024,
  require_file_provenance: true,
};

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function evaluateSecurityHardening(
  bundle: TrustedArtifactBundleV1,
  policy: SecurityHardeningPolicyV1 = DEFAULT_SECURITY_HARDENING_POLICY,
): SecurityHardeningReportV1 {
  const verification = verifyTrustedArtifactBundle(bundle);
  const sizes = bundle.files.map((file) => byteLength(file.content));
  const total_bytes = sizes.reduce((sum, value) => sum + value, 0);
  const largest_file_bytes = sizes.length ? Math.max(...sizes) : 0;

  const checks = {
    bundle_integrity: verification.valid,
    path_safety: verification.paths_valid,
    file_count: bundle.files.length <= policy.max_files,
    total_bytes: total_bytes <= policy.max_total_bytes,
    single_file_bytes: largest_file_bytes <= policy.max_single_file_bytes,
    provenance:
      !policy.require_file_provenance ||
      bundle.files.every((file) => file.provenance_refs.length > 0),
  };

  const reasons: string[] = [];
  if (!checks.bundle_integrity) reasons.push("BUNDLE_INTEGRITY_FAILED");
  if (!checks.path_safety) reasons.push("BUNDLE_PATH_SAFETY_FAILED");
  if (!checks.file_count) reasons.push("BUNDLE_FILE_COUNT_LIMIT_EXCEEDED");
  if (!checks.total_bytes) reasons.push("BUNDLE_TOTAL_BYTES_LIMIT_EXCEEDED");
  if (!checks.single_file_bytes) reasons.push("BUNDLE_SINGLE_FILE_BYTES_LIMIT_EXCEEDED");
  if (!checks.provenance) reasons.push("BUNDLE_FILE_PROVENANCE_REQUIRED");

  return {
    schema: "goodle.security-hardening-report.v1",
    status: reasons.length === 0 ? "HARDENED" : "BLOCKED",
    bundle_id: bundle.bundle_id,
    checks,
    metrics: {
      file_count: bundle.files.length,
      total_bytes,
      largest_file_bytes,
    },
    reasons,
  };
}

export function assertSecurityHardened(
  report: SecurityHardeningReportV1,
): void {
  if (report.status !== "HARDENED") {
    throw new Error(
      `SECURITY_HARDENING_BLOCKED: ${report.reasons.join(",")}`,
    );
  }
}
