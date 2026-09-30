import type { ClosedLoopTrustProofV1 } from "./ClosedLoopTrustProof";
import type { BrowserRuntimeEvidenceProofV1 } from "./BrowserRuntimeProof";
import type { VisualRuntimeEvidenceV1 } from "./VisualRuntimeEvidence";
import { sha256Json } from "./BuildLedger";

export type RuntimeEvidencePackageV1 = {
  schema: "goodle.runtime-evidence-package.v1";
  package_id: string;
  build_id: string;
  logical_build_id: string;
  bundle_id: string;
  execution_id: string;
  closed_loop_proof: ClosedLoopTrustProofV1;
  browser_runtime_proof: BrowserRuntimeEvidenceProofV1;
  visual_runtime_evidence: VisualRuntimeEvidenceV1;
  package_hash: string;
};

export type RuntimeEvidencePackageVerificationV1 = {
  schema: "goodle.runtime-evidence-package-verification.v1";
  valid: boolean;
  checks: {
    closed_loop_hash: boolean;
    browser_proof_hash: boolean;
    visual_evidence_hash: boolean;
    identity_links: boolean;
    package_hash: boolean;
  };
  reasons: string[];
};

function verifyClosedLoopShape(proof: ClosedLoopTrustProofV1): boolean {
  const {
    proof_id: _proofId,
    closed_loop_hash,
    ...unsigned
  } = proof;
  return sha256Json(unsigned) === closed_loop_hash;
}

function verifyBrowserProofShape(proof: BrowserRuntimeEvidenceProofV1): boolean {
  const {
    proof_id: _proofId,
    proof_hash,
    ...unsigned
  } = proof;
  return sha256Json(unsigned) === proof_hash;
}

function verifyVisualShape(evidence: VisualRuntimeEvidenceV1): boolean {
  const {
    evidence_id: _evidenceId,
    visual_hash,
    ...unsigned
  } = evidence;
  return sha256Json(unsigned) === visual_hash;
}

export function createRuntimeEvidencePackage(input: {
  closed_loop_proof: ClosedLoopTrustProofV1;
  browser_runtime_proof: BrowserRuntimeEvidenceProofV1;
  visual_runtime_evidence: VisualRuntimeEvidenceV1;
}): RuntimeEvidencePackageV1 {
  if (!verifyClosedLoopShape(input.closed_loop_proof)) {
    throw new Error("RUNTIME_EVIDENCE_CLOSED_LOOP_INVALID");
  }
  if (!verifyBrowserProofShape(input.browser_runtime_proof)) {
    throw new Error("RUNTIME_EVIDENCE_BROWSER_PROOF_INVALID");
  }
  if (!verifyVisualShape(input.visual_runtime_evidence)) {
    throw new Error("RUNTIME_EVIDENCE_VISUAL_INVALID");
  }

  if (
    input.browser_runtime_proof.closed_loop_proof_id !==
      input.closed_loop_proof.proof_id ||
    input.browser_runtime_proof.closed_loop_hash !==
      input.closed_loop_proof.closed_loop_hash ||
    input.browser_runtime_proof.bundle_id !==
      input.closed_loop_proof.bundle_id ||
    input.browser_runtime_proof.execution_id !==
      input.closed_loop_proof.execution_id
  ) {
    throw new Error("RUNTIME_EVIDENCE_BROWSER_LINK_MISMATCH");
  }

  if (
    input.visual_runtime_evidence.browser_runtime_proof_id !==
      input.browser_runtime_proof.proof_id ||
    input.visual_runtime_evidence.browser_runtime_proof_hash !==
      input.browser_runtime_proof.proof_hash
  ) {
    throw new Error("RUNTIME_EVIDENCE_VISUAL_LINK_MISMATCH");
  }

  const unsigned = {
    schema: "goodle.runtime-evidence-package.v1" as const,
    build_id: input.closed_loop_proof.build_id,
    logical_build_id: input.closed_loop_proof.logical_build_id,
    bundle_id: input.closed_loop_proof.bundle_id,
    execution_id: input.closed_loop_proof.execution_id,
    closed_loop_proof: input.closed_loop_proof,
    browser_runtime_proof: input.browser_runtime_proof,
    visual_runtime_evidence: input.visual_runtime_evidence,
  };

  const package_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    package_id: `runtime-evidence-${package_hash.slice(0, 16)}`,
    package_hash,
  };
}

export function verifyRuntimeEvidencePackage(
  pkg: RuntimeEvidencePackageV1,
): RuntimeEvidencePackageVerificationV1 {
  const reasons: string[] = [];

  const closed_loop_hash = verifyClosedLoopShape(pkg.closed_loop_proof);
  const browser_proof_hash = verifyBrowserProofShape(pkg.browser_runtime_proof);
  const visual_evidence_hash = verifyVisualShape(pkg.visual_runtime_evidence);

  if (!closed_loop_hash) reasons.push("CLOSED_LOOP_HASH_INVALID");
  if (!browser_proof_hash) reasons.push("BROWSER_RUNTIME_PROOF_HASH_INVALID");
  if (!visual_evidence_hash) reasons.push("VISUAL_RUNTIME_EVIDENCE_HASH_INVALID");

  const identity_links =
    pkg.build_id === pkg.closed_loop_proof.build_id &&
    pkg.logical_build_id === pkg.closed_loop_proof.logical_build_id &&
    pkg.bundle_id === pkg.closed_loop_proof.bundle_id &&
    pkg.execution_id === pkg.closed_loop_proof.execution_id &&
    pkg.browser_runtime_proof.closed_loop_proof_id === pkg.closed_loop_proof.proof_id &&
    pkg.browser_runtime_proof.closed_loop_hash === pkg.closed_loop_proof.closed_loop_hash &&
    pkg.browser_runtime_proof.bundle_id === pkg.bundle_id &&
    pkg.browser_runtime_proof.execution_id === pkg.execution_id &&
    pkg.visual_runtime_evidence.browser_runtime_proof_id === pkg.browser_runtime_proof.proof_id &&
    pkg.visual_runtime_evidence.browser_runtime_proof_hash === pkg.browser_runtime_proof.proof_hash;

  if (!identity_links) reasons.push("RUNTIME_EVIDENCE_IDENTITY_LINKS_INVALID");

  const {
    package_id: _packageId,
    package_hash,
    ...unsigned
  } = pkg;

  const package_hash_valid = sha256Json(unsigned) === package_hash;
  if (!package_hash_valid) reasons.push("RUNTIME_EVIDENCE_PACKAGE_HASH_INVALID");

  return {
    schema: "goodle.runtime-evidence-package-verification.v1",
    valid:
      closed_loop_hash &&
      browser_proof_hash &&
      visual_evidence_hash &&
      identity_links &&
      package_hash_valid,
    checks: {
      closed_loop_hash,
      browser_proof_hash,
      visual_evidence_hash,
      identity_links,
      package_hash: package_hash_valid,
    },
    reasons,
  };
}
