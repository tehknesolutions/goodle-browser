import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import type { TrustedBundlePolicy, TrustedBundleVerificationResult } from "./TrustedBundleConsumer";
import { assertTrustedBundleExecutable, evaluateTrustedBundle } from "./TrustedBundleConsumer";
import { sha256Json } from "./BuildLedger";

export type TrustedDeploymentAction = "DEPLOY" | "IMPORT" | "EXECUTE";

export type TrustedDeploymentRequest = {
  action: TrustedDeploymentAction;
  environment: string;
  bundle: TrustedArtifactBundleV1;
  policy?: TrustedBundlePolicy;
};

export type TrustedDeploymentReceiptV1 = {
  schema: "goodle.trusted-deployment-receipt.v1";
  receipt_id: string;
  action: TrustedDeploymentAction;
  environment: string;
  bundle_id: string;
  build_id: string;
  logical_build_id: string;
  attestation_id: string;
  ledger_hash: string;
  verification: TrustedBundleVerificationResult;
  status: "AUTHORIZED" | "BLOCKED";
  receipt_hash: string;
};

export function authorizeTrustedDeployment(
  request: TrustedDeploymentRequest,
): TrustedDeploymentReceiptV1 {
  const verification = evaluateTrustedBundle(request.bundle, request.policy);

  let status: TrustedDeploymentReceiptV1["status"] = "AUTHORIZED";
  try {
    assertTrustedBundleExecutable(verification);
  } catch {
    status = "BLOCKED";
  }

  const unsigned = {
    schema: "goodle.trusted-deployment-receipt.v1" as const,
    action: request.action,
    environment: request.environment,
    bundle_id: request.bundle.bundle_id,
    build_id: request.bundle.build_id,
    logical_build_id: request.bundle.logical_build_id,
    attestation_id: request.bundle.attestation.attestation_id,
    ledger_hash: request.bundle.attestation.trust.ledger_hash,
    verification,
    status,
  };

  const receipt_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    receipt_id: `deploy-${request.action.toLowerCase()}-${receipt_hash.slice(0, 16)}`,
    receipt_hash,
  };
}

export function assertTrustedDeploymentAuthorized(
  receipt: TrustedDeploymentReceiptV1,
): void {
  if (receipt.status !== "AUTHORIZED") {
    throw new Error(
      `TRUSTED_DEPLOYMENT_BLOCKED: ${receipt.verification.decision}: ${receipt.verification.reasons.join(",")}`,
    );
  }
}

export function verifyTrustedDeploymentReceipt(
  receipt: TrustedDeploymentReceiptV1,
): boolean {
  const {
    receipt_id: _receiptId,
    receipt_hash,
    ...unsigned
  } = receipt;

  return sha256Json(unsigned) === receipt_hash;
}
