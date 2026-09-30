import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import { verifyTrustedArtifactBundle } from "./TrustedArtifactBundle";
import type { PromotionPolicyV1 } from "./PromotionPipeline";
import { sha256Json } from "./BuildLedger";

export type ReleaseStatus = "RC" | "RELEASED" | "REVOKED";

export type ReleaseManifestV1 = {
  schema: "goodle.release-manifest.v1";
  release_id: string;
  version: string;
  status: ReleaseStatus;
  bundle_id: string;
  build_id: string;
  logical_build_id: string;
  attestation_id: string;
  certification_status: TrustedArtifactBundleV1["attestation"]["certification_status"];
  promotion_policy: PromotionPolicyV1;
  release_hash: string;
  revoked_reason?: string;
};

function createReleaseHash(input: Omit<ReleaseManifestV1, "release_id" | "release_hash">): string {
  return sha256Json(input);
}

export function createReleaseCandidate(input: {
  version: string;
  bundle: TrustedArtifactBundleV1;
  promotion_policy: PromotionPolicyV1;
}): ReleaseManifestV1 {
  if (!input.version.trim()) throw new Error("RELEASE_VERSION_REQUIRED");

  const verification = verifyTrustedArtifactBundle(input.bundle);
  if (!verification.valid) {
    throw new Error("RELEASE_BUNDLE_INTEGRITY_FAILED");
  }
  if (input.bundle.attestation.certification_status !== "CERTIFIED") {
    throw new Error("RELEASE_REQUIRES_CERTIFIED_BUILD");
  }

  const unsigned = {
    schema: "goodle.release-manifest.v1" as const,
    version: input.version,
    status: "RC" as const,
    bundle_id: input.bundle.bundle_id,
    build_id: input.bundle.build_id,
    logical_build_id: input.bundle.logical_build_id,
    attestation_id: input.bundle.attestation.attestation_id,
    certification_status: input.bundle.attestation.certification_status,
    promotion_policy: input.promotion_policy,
  };

  const release_hash = createReleaseHash(unsigned);

  return {
    ...unsigned,
    release_id: `release-${input.version}-${release_hash.slice(0, 12)}`,
    release_hash,
  };
}

export function releaseCandidate(
  manifest: ReleaseManifestV1,
): ReleaseManifestV1 {
  if (!verifyReleaseManifest(manifest)) {
    throw new Error("RELEASE_MANIFEST_INTEGRITY_FAILED");
  }
  if (manifest.status !== "RC") {
    throw new Error(`RELEASE_INVALID_STATE_TRANSITION: ${manifest.status} -> RELEASED`);
  }

  const unsigned = {
    schema: manifest.schema,
    version: manifest.version,
    status: "RELEASED" as const,
    bundle_id: manifest.bundle_id,
    build_id: manifest.build_id,
    logical_build_id: manifest.logical_build_id,
    attestation_id: manifest.attestation_id,
    certification_status: manifest.certification_status,
    promotion_policy: manifest.promotion_policy,
  };
  const release_hash = createReleaseHash(unsigned);

  return {
    ...unsigned,
    release_id: `release-${manifest.version}-${release_hash.slice(0, 12)}`,
    release_hash,
  };
}

export function revokeRelease(
  manifest: ReleaseManifestV1,
  reason: string,
): ReleaseManifestV1 {
  if (!verifyReleaseManifest(manifest)) {
    throw new Error("RELEASE_MANIFEST_INTEGRITY_FAILED");
  }
  if (!reason.trim()) throw new Error("RELEASE_REVOCATION_REASON_REQUIRED");
  if (manifest.status === "REVOKED") {
    throw new Error("RELEASE_ALREADY_REVOKED");
  }

  const unsigned = {
    schema: manifest.schema,
    version: manifest.version,
    status: "REVOKED" as const,
    bundle_id: manifest.bundle_id,
    build_id: manifest.build_id,
    logical_build_id: manifest.logical_build_id,
    attestation_id: manifest.attestation_id,
    certification_status: manifest.certification_status,
    promotion_policy: manifest.promotion_policy,
    revoked_reason: reason,
  };
  const release_hash = createReleaseHash(unsigned);

  return {
    ...unsigned,
    release_id: `release-${manifest.version}-${release_hash.slice(0, 12)}`,
    release_hash,
  };
}

export function verifyReleaseManifest(manifest: ReleaseManifestV1): boolean {
  const {
    release_id: _releaseId,
    release_hash,
    ...unsigned
  } = manifest;

  return createReleaseHash(unsigned) === release_hash;
}
