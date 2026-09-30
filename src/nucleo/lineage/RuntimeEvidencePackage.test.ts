import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { ClosedLoopTrustProofV1 } from "./ClosedLoopTrustProof";
import type { BrowserRuntimeEvidenceProofV1 } from "./BrowserRuntimeProof";
import type { VisualRuntimeEvidenceV1 } from "./VisualRuntimeEvidence";
import {
  createRuntimeEvidencePackage,
  verifyRuntimeEvidencePackage,
} from "./RuntimeEvidencePackage";

function closedLoop(): ClosedLoopTrustProofV1 {
  const unsigned = {
    schema: "goodle.closed-loop-trust-proof.v1" as const,
    base_trust_proof_id: "trust-1",
    base_trust_proof_hash: "trust-hash-1",
    build_id: "build-1",
    logical_build_id: "logical-1",
    bundle_id: "bundle-1",
    execution_id: "exec-1",
    admission_receipt_id: "admission-1",
    admission_receipt_hash: "admission-hash-1",
    terminal_receipt_id: "terminal-1",
    terminal_receipt_hash: "terminal-hash-1",
    execution_chronicle_hash: "chronicle-1",
    execution_chronicle_head_hash: "chronicle-head-1",
    outcome_attestation_id: "outcome-1",
    outcome_attestation_hash: "outcome-hash-1",
    outcome: "SUCCEEDED" as const,
    result_ref: "result://1",
    error_code: undefined,
    runtime_environment: "runtime",
  };

  return {
    ...unsigned,
    proof_id: "closed-loop-1",
    closed_loop_hash: sha256Json(unsigned),
  };
}

function browserProof(loop: ClosedLoopTrustProofV1): BrowserRuntimeEvidenceProofV1 {
  const unsigned = {
    schema: "goodle.browser-runtime-evidence-proof.v1" as const,
    closed_loop_proof_id: loop.proof_id,
    closed_loop_hash: loop.closed_loop_hash,
    bundle_id: loop.bundle_id,
    execution_id: loop.execution_id,
    browser_engine: "chromium" as const,
    react_dom_mounted: true as const,
    phaser_canvas_booted: true as const,
    phaser_scene_key: "GoodleScene",
    canvas_width: 320,
    canvas_height: 180,
    observation_hash: "observation-1",
  };

  return {
    ...unsigned,
    proof_id: "browser-proof-1",
    proof_hash: sha256Json(unsigned),
  };
}

function visual(proof: BrowserRuntimeEvidenceProofV1): VisualRuntimeEvidenceV1 {
  const unsigned = {
    schema: "goodle.visual-runtime-evidence.v1" as const,
    browser_runtime_proof_id: proof.proof_id,
    browser_runtime_proof_hash: proof.proof_hash,
    screenshot_sha256:
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    screenshot_bytes: 1234,
    mime_type: "image/png" as const,
    viewport: { width: 800, height: 600 },
  };

  return {
    ...unsigned,
    evidence_id: "visual-1",
    visual_hash: sha256Json(unsigned),
  };
}

describe("M45 Runtime Evidence Package", () => {
  it("creates a portable package linking all runtime evidence layers", () => {
    const loop = closedLoop();
    const browser = browserProof(loop);
    const visualEvidence = visual(browser);

    const pkg = createRuntimeEvidencePackage({
      closed_loop_proof: loop,
      browser_runtime_proof: browser,
      visual_runtime_evidence: visualEvidence,
    });

    expect(pkg).toMatchObject({
      schema: "goodle.runtime-evidence-package.v1",
      build_id: "build-1",
      logical_build_id: "logical-1",
      bundle_id: "bundle-1",
      execution_id: "exec-1",
    });
    expect(verifyRuntimeEvidencePackage(pkg)).toMatchObject({
      valid: true,
      reasons: [],
    });
  });

  it("detects visual evidence detached from browser proof", () => {
    const loop = closedLoop();
    const browser = browserProof(loop);
    const visualEvidence = visual(browser);

    expect(() =>
      createRuntimeEvidencePackage({
        closed_loop_proof: loop,
        browser_runtime_proof: browser,
        visual_runtime_evidence: {
          ...visualEvidence,
          browser_runtime_proof_id: "browser-other",
        },
      }),
    ).toThrow("RUNTIME_EVIDENCE_VISUAL_LINK_MISMATCH");
  });

  it("detects package tampering", () => {
    const loop = closedLoop();
    const browser = browserProof(loop);
    const visualEvidence = visual(browser);
    const pkg = createRuntimeEvidencePackage({
      closed_loop_proof: loop,
      browser_runtime_proof: browser,
      visual_runtime_evidence: visualEvidence,
    });

    const verification = verifyRuntimeEvidencePackage({
      ...pkg,
      execution_id: "exec-tampered",
    });

    expect(verification.valid).toBe(false);
    expect(verification.reasons).toContain(
      "RUNTIME_EVIDENCE_IDENTITY_LINKS_INVALID",
    );
    expect(verification.reasons).toContain(
      "RUNTIME_EVIDENCE_PACKAGE_HASH_INVALID",
    );
  });
});
