import type { RuntimeEvidencePackageV1 } from "./RuntimeEvidencePackage";
import {
  verifyRuntimeEvidencePackage,
  type RuntimeEvidencePackageVerificationV1,
} from "./RuntimeEvidencePackage";

export type EvidencePackageDecision =
  | "ACCEPTED"
  | "QUARANTINED"
  | "REJECTED";

export type EvidencePackageAdmissionTarget =
  | "IMPORT"
  | "PUBLISH"
  | "MARKETPLACE"
  | "HNK_VERSE";

export type EvidencePackageConsumerPolicyV1 = {
  target: EvidencePackageAdmissionTarget;
  require_succeeded_outcome?: boolean;
  allowed_runtime_environments?: string[];
  allowed_browser_engines?: Array<
    RuntimeEvidencePackageV1["browser_runtime_proof"]["browser_engine"]
  >;
  min_screenshot_bytes?: number;
  max_screenshot_bytes?: number;
  min_canvas_width?: number;
  min_canvas_height?: number;
};

export type EvidencePackageConsumerResultV1 = {
  schema: "goodle.evidence-package-consumer-result.v1";
  package_id: string;
  target: EvidencePackageAdmissionTarget;
  decision: EvidencePackageDecision;
  admissible: boolean;
  reasons: string[];
  verification: RuntimeEvidencePackageVerificationV1;
};

export function consumeRuntimeEvidencePackage(input: {
  package: RuntimeEvidencePackageV1;
  policy: EvidencePackageConsumerPolicyV1;
}): EvidencePackageConsumerResultV1 {
  const verification = verifyRuntimeEvidencePackage(input.package);
  const reasons = [...verification.reasons];

  if (!verification.valid) {
    return {
      schema: "goodle.evidence-package-consumer-result.v1",
      package_id: input.package.package_id,
      target: input.policy.target,
      decision: "REJECTED",
      admissible: false,
      reasons,
      verification,
    };
  }

  if (
    input.policy.require_succeeded_outcome &&
    input.package.closed_loop_proof.outcome !== "SUCCEEDED"
  ) {
    reasons.push("SUCCESSFUL_OUTCOME_REQUIRED");
  }

  if (
    input.policy.allowed_runtime_environments &&
    !input.policy.allowed_runtime_environments.includes(
      input.package.closed_loop_proof.runtime_environment,
    )
  ) {
    reasons.push("RUNTIME_ENVIRONMENT_NOT_ALLOWED");
  }

  if (
    input.policy.allowed_browser_engines &&
    !input.policy.allowed_browser_engines.includes(
      input.package.browser_runtime_proof.browser_engine,
    )
  ) {
    reasons.push("BROWSER_ENGINE_NOT_ALLOWED");
  }

  const screenshotBytes =
    input.package.visual_runtime_evidence.screenshot_bytes;

  if (
    input.policy.min_screenshot_bytes !== undefined &&
    screenshotBytes < input.policy.min_screenshot_bytes
  ) {
    reasons.push("SCREENSHOT_TOO_SMALL");
  }

  if (
    input.policy.max_screenshot_bytes !== undefined &&
    screenshotBytes > input.policy.max_screenshot_bytes
  ) {
    reasons.push("SCREENSHOT_TOO_LARGE");
  }

  if (
    input.policy.min_canvas_width !== undefined &&
    input.package.browser_runtime_proof.canvas_width <
      input.policy.min_canvas_width
  ) {
    reasons.push("CANVAS_WIDTH_BELOW_POLICY");
  }

  if (
    input.policy.min_canvas_height !== undefined &&
    input.package.browser_runtime_proof.canvas_height <
      input.policy.min_canvas_height
  ) {
    reasons.push("CANVAS_HEIGHT_BELOW_POLICY");
  }

  const decision: EvidencePackageDecision =
    reasons.length === 0 ? "ACCEPTED" : "QUARANTINED";

  return {
    schema: "goodle.evidence-package-consumer-result.v1",
    package_id: input.package.package_id,
    target: input.policy.target,
    decision,
    admissible: decision === "ACCEPTED",
    reasons,
    verification,
  };
}

export function assertEvidencePackageAdmissible(
  result: EvidencePackageConsumerResultV1,
): void {
  if (!result.admissible) {
    throw new Error(
      `EVIDENCE_PACKAGE_NOT_ADMISSIBLE: ${result.decision}: ${result.reasons.join(",")}`,
    );
  }
}

export const MARKETPLACE_ADMISSION_POLICY_V1: EvidencePackageConsumerPolicyV1 = {
  target: "MARKETPLACE",
  require_succeeded_outcome: true,
  allowed_browser_engines: ["chromium"],
  min_screenshot_bytes: 1,
  min_canvas_width: 1,
  min_canvas_height: 1,
};

export const HNK_VERSE_ADMISSION_POLICY_V1: EvidencePackageConsumerPolicyV1 = {
  target: "HNK_VERSE",
  require_succeeded_outcome: true,
  allowed_browser_engines: ["chromium"],
  min_screenshot_bytes: 1,
  min_canvas_width: 1,
  min_canvas_height: 1,
};
