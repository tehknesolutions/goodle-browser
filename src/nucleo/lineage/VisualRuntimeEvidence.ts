import type { BrowserRuntimeEvidenceProofV1 } from "./BrowserRuntimeProof";
import { sha256Json } from "./BuildLedger";

export type VisualRuntimeEvidenceV1 = {
  schema: "goodle.visual-runtime-evidence.v1";
  evidence_id: string;
  browser_runtime_proof_id: string;
  browser_runtime_proof_hash: string;
  screenshot_sha256: string;
  screenshot_bytes: number;
  mime_type: "image/png";
  viewport: {
    width: number;
    height: number;
  };
  visual_hash: string;
};

export function createVisualRuntimeEvidence(input: {
  browser_proof: BrowserRuntimeEvidenceProofV1;
  screenshot_sha256: string;
  screenshot_bytes: number;
  viewport: { width: number; height: number };
}): VisualRuntimeEvidenceV1 {
  if (!/^[a-f0-9]{64}$/i.test(input.screenshot_sha256)) {
    throw new Error("VISUAL_RUNTIME_INVALID_SCREENSHOT_HASH");
  }
  if (input.screenshot_bytes <= 0) {
    throw new Error("VISUAL_RUNTIME_EMPTY_SCREENSHOT");
  }
  if (input.viewport.width <= 0 || input.viewport.height <= 0) {
    throw new Error("VISUAL_RUNTIME_INVALID_VIEWPORT");
  }

  const unsigned = {
    schema: "goodle.visual-runtime-evidence.v1" as const,
    browser_runtime_proof_id: input.browser_proof.proof_id,
    browser_runtime_proof_hash: input.browser_proof.proof_hash,
    screenshot_sha256: input.screenshot_sha256.toLowerCase(),
    screenshot_bytes: input.screenshot_bytes,
    mime_type: "image/png" as const,
    viewport: { ...input.viewport },
  };

  const visual_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    evidence_id: `visual-runtime-${visual_hash.slice(0, 16)}`,
    visual_hash,
  };
}

export function verifyVisualRuntimeEvidence(input: {
  evidence: VisualRuntimeEvidenceV1;
  browser_proof: BrowserRuntimeEvidenceProofV1;
  screenshot_sha256: string;
  screenshot_bytes: number;
}): boolean {
  const {
    evidence_id: _evidenceId,
    visual_hash,
    ...unsigned
  } = input.evidence;

  return (
    input.evidence.browser_runtime_proof_id === input.browser_proof.proof_id &&
    input.evidence.browser_runtime_proof_hash === input.browser_proof.proof_hash &&
    input.evidence.screenshot_sha256 === input.screenshot_sha256.toLowerCase() &&
    input.evidence.screenshot_bytes === input.screenshot_bytes &&
    sha256Json(unsigned) === visual_hash
  );
}
