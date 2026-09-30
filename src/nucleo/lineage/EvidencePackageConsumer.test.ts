import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { ClosedLoopTrustProofV1 } from "./ClosedLoopTrustProof";
import type { BrowserRuntimeEvidenceProofV1 } from "./BrowserRuntimeProof";
import type { VisualRuntimeEvidenceV1 } from "./VisualRuntimeEvidence";
import { createRuntimeEvidencePackage } from "./RuntimeEvidencePackage";
import {
  consumeRuntimeEvidencePackage,
  assertEvidencePackageAdmissible,
  MARKETPLACE_ADMISSION_POLICY_V1,
  HNK_VERSE_ADMISSION_POLICY_V1,
} from "./EvidencePackageConsumer";

function closedLoop(
  outcome: "SUCCEEDED" | "FAILED" = "SUCCEEDED",
): ClosedLoopTrustProofV1 {
  const unsigned = {
    schema: "goodle.closed-loop-trust-proof.v1" as const,
    base_trust_proof_id: "trust-46",
    base_trust_proof_hash: "trust-hash-46",
    build_id: "build-46",
    logical_build_id: "logical-46",
    bundle_id: "bundle-46",
    execution_id: "exec-46",
    admission_receipt_id: "admission-46",
    admission_receipt_hash: "admission-hash-46",
    terminal_receipt_id: "terminal-46",
    terminal_receipt_hash: "terminal-hash-46",
    execution_chronicle_hash: "chronicle-46",
    execution_chronicle_head_hash: "chronicle-head-46",
    outcome_attestation_id: "outcome-46",
    outcome_attestation_hash: "outcome-hash-46",
    outcome,
    result_ref: outcome === "SUCCEEDED" ? "result://46" : undefined,
    error_code: outcome === "FAILED" ? "RUNTIME_FAILURE" : undefined,
    runtime_environment: "production",
  };

  return {
    ...unsigned,
    proof_id: "closed-loop-46",
    closed_loop_hash: sha256Json(unsigned),
  };
}

function browser(loop: ClosedLoopTrustProofV1): BrowserRuntimeEvidenceProofV1 {
  const unsigned = {
    schema: "goodle.browser-runtime-evidence-proof.v1" as const,
    closed_loop_proof_id: loop.proof_id,
    closed_loop_hash: loop.closed_loop_hash,
    bundle_id: loop.bundle_id,
    execution_id: loop.execution_id,
    browser_engine: "chromium" as const,
    react_dom_mounted: true as const,
    phaser_canvas_booted: true as const,
    phaser_scene_key: "GoodleMarketplaceScene",
    canvas_width: 320,
    canvas_height: 180,
    observation_hash: "observation-46",
  };

  return {
    ...unsigned,
    proof_id: "browser-46",
    proof_hash: sha256Json(unsigned),
  };
}

function visual(proof: BrowserRuntimeEvidenceProofV1): VisualRuntimeEvidenceV1 {
  const unsigned = {
    schema: "goodle.visual-runtime-evidence.v1" as const,
    browser_runtime_proof_id: proof.proof_id,
    browser_runtime_proof_hash: proof.proof_hash,
    screenshot_sha256:
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    screenshot_bytes: 4096,
    mime_type: "image/png" as const,
    viewport: { width: 800, height: 600 },
  };

  return {
    ...unsigned,
    evidence_id: "visual-46",
    visual_hash: sha256Json(unsigned),
  };
}

function pkg(outcome: "SUCCEEDED" | "FAILED" = "SUCCEEDED") {
  const loop = closedLoop(outcome);
  const browserProof = browser(loop);
  return createRuntimeEvidencePackage({
    closed_loop_proof: loop,
    browser_runtime_proof: browserProof,
    visual_runtime_evidence: visual(browserProof),
  });
}

describe("M46 Evidence Package Consumer", () => {
  it("accepts a valid successful package for marketplace admission", () => {
    const result = consumeRuntimeEvidencePackage({
      package: pkg(),
      policy: MARKETPLACE_ADMISSION_POLICY_V1,
    });

    expect(result).toMatchObject({
      target: "MARKETPLACE",
      decision: "ACCEPTED",
      admissible: true,
      reasons: [],
    });
    expect(() => assertEvidencePackageAdmissible(result)).not.toThrow();
  });

  it("accepts the same evidence package for HNK-VERSE admission", () => {
    const result = consumeRuntimeEvidencePackage({
      package: pkg(),
      policy: HNK_VERSE_ADMISSION_POLICY_V1,
    });

    expect(result).toMatchObject({
      target: "HNK_VERSE",
      decision: "ACCEPTED",
      admissible: true,
    });
  });

  it("quarantines a structurally valid failed execution when success is required", () => {
    const result = consumeRuntimeEvidencePackage({
      package: pkg("FAILED"),
      policy: MARKETPLACE_ADMISSION_POLICY_V1,
    });

    expect(result.decision).toBe("QUARANTINED");
    expect(result.admissible).toBe(false);
    expect(result.reasons).toContain("SUCCESSFUL_OUTCOME_REQUIRED");
  });

  it("quarantines packages that fail consumer size or canvas policy", () => {
    const result = consumeRuntimeEvidencePackage({
      package: pkg(),
      policy: {
        target: "PUBLISH",
        min_screenshot_bytes: 10_000,
        min_canvas_width: 640,
        min_canvas_height: 360,
      },
    });

    expect(result.decision).toBe("QUARANTINED");
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "SCREENSHOT_TOO_SMALL",
        "CANVAS_WIDTH_BELOW_POLICY",
        "CANVAS_HEIGHT_BELOW_POLICY",
      ]),
    );
  });

  it("rejects a tampered evidence package before policy evaluation", () => {
    const original = pkg();
    const result = consumeRuntimeEvidencePackage({
      package: {
        ...original,
        execution_id: "exec-tampered",
      },
      policy: MARKETPLACE_ADMISSION_POLICY_V1,
    });

    expect(result.decision).toBe("REJECTED");
    expect(result.admissible).toBe(false);
    expect(result.reasons).toContain(
      "RUNTIME_EVIDENCE_IDENTITY_LINKS_INVALID",
    );
  });
});
