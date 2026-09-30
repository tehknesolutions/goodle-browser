# M62 Trust Proof Admission Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert a verified M61 End-to-End External Trust Proof into a deterministic, independently verifiable operational admission result with versioned policy, fail-closed REVIEW handling, historical reviewer authority, and immutable human-review receipts.

**Architecture:** Add four focused lineage units beside the existing M61 proof: admission policy/decision, reviewer authority registry, review receipt/history, and final admission resolution. Every downstream artifact binds exact upstream hashes/identities; M61 verification remains authoritative and neither policy nor human review may override an invalid proof or an original REJECT.

**Tech Stack:** TypeScript, existing `src/nucleo/lineage` primitives, `sha256Json()` from `BuildLedger`, Vitest/project test runner, existing M61 `verifyEndToEndExternalTrustProof()`.

**Spec:** `docs/superpowers/specs/2026-09-30-m62-trust-proof-admission-gate-design.md`

## Global Constraints

- Fail closed: unknown/malformed/error paths MUST NOT produce ACCEPT.
- M61 proof and all upstream evidence remain immutable.
- Policies are explicit, hash-verifiable, and identified by `policy_id` + `policy_version`.
- REVIEW is blocked by default; pending-review capabilities require positive enumeration.
- Reviewer authority is historical and tamper-evident.
- Human review resolves REVIEW only; it cannot override REJECT or invalid M61 evidence.
- Final admitted scope can never exceed both requested scope and policy scope.
- Follow existing `src/nucleo/lineage` naming, structural-hash, reason-code, and colocated-test conventions.

## Review Focus

- Duplicate capability names or reordered capability arrays must have deterministic semantics; tests pin canonical normalization/rejection in Task 1.
- Unknown policy schema/version must fail verification and never ACCEPT; tests pin this in Task 1.
- Authority sequence outside registry history must fail closed; tests pin this in Task 2.
- Multiple/conflicting review receipts must never select the more permissive result; tests pin this in Task 3/4.
- A receipt valid for one requested operation must not be replayable for another scope; tests pin exact decision/scope binding in Task 3.

---

### Task 1: Versioned Admission Policy and Verifiable Admission Decision

**Files:**
- Create: `src/nucleo/lineage/TrustProofAdmissionGate.ts`
- Create: `src/nucleo/lineage/TrustProofAdmissionGate.test.ts`

**Interfaces:**
- Consumes: `EndToEndExternalTrustProofV1`, `verifyEndToEndExternalTrustProof()`, `sha256Json()`.
- Produces: `TrustProofAdmissionPolicyV1`, `TrustProofAdmissionDecisionV1`, `createTrustProofAdmissionPolicy()`, `verifyTrustProofAdmissionPolicy()`, `evaluateTrustProofAdmission()`, `verifyTrustProofAdmissionDecision()`.

- [ ] **Step 1: Write failing policy tests**

Add tests proving: schema is `goodle.trust-proof-admission-policy.v1`; policy hash detects mutation; duplicate capability entries are rejected or normalized deterministically; unknown schema/version fails verification.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- TrustProofAdmissionGate.test.ts`
Expected: FAIL because the module/API does not exist.

- [ ] **Step 3: Implement policy types and APIs**

Implement:

```ts
createTrustProofAdmissionPolicy(input: {
  policy_id: string;
  policy_version: string;
  accept_capabilities: string[];
  review_capabilities: string[];
  reject_capabilities: string[];
  pending_review_capabilities?: string[];
}): TrustProofAdmissionPolicyV1

verifyTrustProofAdmissionPolicy(policy: TrustProofAdmissionPolicyV1): boolean
```

Use structural hashing and deterministic capability-set semantics consistent with project conventions.

- [ ] **Step 4: Run focused policy tests and verify GREEN**

Run: `npm test -- TrustProofAdmissionGate.test.ts`
Expected: policy tests PASS.

- [ ] **Step 5: Write failing admission-decision tests**

Cover: valid M61 + accepted capability → ACCEPT; review capability → REVIEW; rejected capability → REJECT; invalid/tampered M61 → REJECT regardless of policy; malformed policy → never ACCEPT; unlisted capability → REVIEW/fail-closed; decision binds proof hash, policy hash/version and requested capability; stored outcome/reasons/hash tampering is detected by verification.

- [ ] **Step 6: Run focused tests and verify RED**

Run: `npm test -- TrustProofAdmissionGate.test.ts`
Expected: new decision tests FAIL.

- [ ] **Step 7: Implement decision evaluation and verification**

Implement:

```ts
evaluateTrustProofAdmission(input: {
  proof: EndToEndExternalTrustProofV1;
  policy: TrustProofAdmissionPolicyV1;
  requested_capability: string;
}): TrustProofAdmissionDecisionV1

verifyTrustProofAdmissionDecision(input: {
  proof: EndToEndExternalTrustProofV1;
  policy: TrustProofAdmissionPolicyV1;
  decision: TrustProofAdmissionDecisionV1;
}): { valid: boolean; reasons: string[] }
```

Verification recomputes M61 validity and decision semantics instead of trusting the stored outcome.

- [ ] **Step 8: Run focused tests and verify GREEN**

Run: `npm test -- TrustProofAdmissionGate.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit Task 1**

```bash
git add src/nucleo/lineage/TrustProofAdmissionGate.ts src/nucleo/lineage/TrustProofAdmissionGate.test.ts
git commit -m "feat: add M62 trust proof admission policy gate"
```

### Task 2: Historical Reviewer Authority Registry

**Files:**
- Create: `src/nucleo/lineage/ReviewerAuthorityRegistry.ts`
- Create: `src/nucleo/lineage/ReviewerAuthorityRegistry.test.ts`

**Interfaces:**
- Consumes: `sha256Json()` and project append-only/hash-chain conventions.
- Produces: `ReviewerAuthorityRegistryV1`, `createReviewerAuthorityRegistry()`, `authorizeReviewer()`, `revokeReviewer()`, `verifyReviewerAuthorityRegistry()`, `reviewerWasAuthorizedAtSequence()`.

- [ ] **Step 1: Write failing authority lifecycle tests**

Cover AUTHORIZE → active, REVOKE → prospectively inactive, historical authorization before later revocation remains true, arbitrary reviewer fails, double authorization/revocation invalid transitions fail, requested capability/scope is enforced, out-of-range historical sequence fails closed, and entry/hash-chain mutation invalidates registry.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- ReviewerAuthorityRegistry.test.ts`
Expected: FAIL because module/API does not exist.

- [ ] **Step 3: Implement registry lifecycle**

Implement:

```ts
createReviewerAuthorityRegistry(): ReviewerAuthorityRegistryV1
authorizeReviewer(registry, input: { reviewer_id: string; capabilities: string[] }): ReviewerAuthorityRegistryV1
revokeReviewer(registry, input: { reviewer_id: string }): ReviewerAuthorityRegistryV1
verifyReviewerAuthorityRegistry(registry: ReviewerAuthorityRegistryV1): boolean
reviewerWasAuthorizedAtSequence(input: {
  registry: ReviewerAuthorityRegistryV1;
  reviewer_id: string;
  capability: string;
  sequence: number;
}): boolean
```

Keep history append-only; derive authority at the referenced sequence rather than current state.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- ReviewerAuthorityRegistry.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/nucleo/lineage/ReviewerAuthorityRegistry.ts src/nucleo/lineage/ReviewerAuthorityRegistry.test.ts
git commit -m "feat: add M62 reviewer authority registry"
```

### Task 3: Immutable Review Decision Receipt and Append-Only History

**Files:**
- Create: `src/nucleo/lineage/ReviewDecisionReceipt.ts`
- Create: `src/nucleo/lineage/ReviewDecisionReceipt.test.ts`

**Interfaces:**
- Consumes: `TrustProofAdmissionPolicyV1`, `TrustProofAdmissionDecisionV1`, `ReviewerAuthorityRegistryV1`, `reviewerWasAuthorizedAtSequence()`, `sha256Json()`.
- Produces: `ReviewDecisionReceiptV1`, `ReviewDecisionReceiptRegistryV1`, `createReviewDecisionReceipt()`, `verifyReviewDecisionReceipt()`, receipt-registry append/verification helpers.

- [ ] **Step 1: Write failing receipt tests**

Cover: receipt can only resolve an original REVIEW; exact proof/policy/version/hash/decision/capability binding; arbitrary reviewer fails; reviewer revoked before referenced sequence fails; reviewer authorized at referenced sequence then revoked later remains historically valid; receipt cannot expand requested/policy scope; replay against another proof/policy/decision/capability fails; receipt mutation fails hash verification.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- ReviewDecisionReceipt.test.ts`
Expected: FAIL because module/API does not exist.

- [ ] **Step 3: Implement receipt creation and verification**

Implement:

```ts
createReviewDecisionReceipt(input: {
  proof: EndToEndExternalTrustProofV1;
  policy: TrustProofAdmissionPolicyV1;
  decision: TrustProofAdmissionDecisionV1;
  authority_registry: ReviewerAuthorityRegistryV1;
  authority_sequence: number;
  reviewer_id: string;
  human_decision: "APPROVE" | "DENY";
  capability: string;
  reason: string;
}): ReviewDecisionReceiptV1

verifyReviewDecisionReceipt(input: { ...same evidence plus receipt... }): { valid: boolean; reasons: string[] }
```

Creation must reject invalid upstream evidence rather than manufacturing a receipt for it.

- [ ] **Step 4: Run receipt tests and verify GREEN**

Run: `npm test -- ReviewDecisionReceipt.test.ts`
Expected: receipt tests PASS.

- [ ] **Step 5: Write failing append-only/conflict tests**

Cover duplicate receipt rejection, tampered history rejection, and conflicting receipts for the same decision/capability. Conflict semantics MUST fail closed and never select the more permissive receipt.

- [ ] **Step 6: Implement receipt registry/history**

Add append-only structural/hash-chain helpers in the same focused module; expose only the minimal functions required by final resolution.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run: `npm test -- ReviewDecisionReceipt.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit Task 3**

```bash
git add src/nucleo/lineage/ReviewDecisionReceipt.ts src/nucleo/lineage/ReviewDecisionReceipt.test.ts
git commit -m "feat: add M62 review decision receipts"
```

### Task 4: Final Admission Resolver

**Files:**
- Create: `src/nucleo/lineage/FinalAdmissionResolver.ts`
- Create: `src/nucleo/lineage/FinalAdmissionResolver.test.ts`

**Interfaces:**
- Consumes: verified M61 proof, policy/decision APIs from Task 1, reviewer authority from Task 2, review receipt/history from Task 3.
- Produces: `resolveFinalAdmission()` and a hash-verifiable final result type.

- [ ] **Step 1: Write failing final-resolution tests**

Cover: ACCEPT admits only requested/policy scope; REJECT always blocks and cannot be overridden; REVIEW without receipt blocks; REVIEW permits only positively enumerated pending-review capability; valid APPROVE receipt admits bounded scope; valid DENY blocks; malformed/stale/mismatched/unauthorized/tampered receipt blocks; conflicting receipts block; unexpected/invalid evidence path never admits.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- FinalAdmissionResolver.test.ts`
Expected: FAIL because resolver does not exist.

- [ ] **Step 3: Implement final resolver**

Implement:

```ts
resolveFinalAdmission(input: {
  proof: EndToEndExternalTrustProofV1;
  policy: TrustProofAdmissionPolicyV1;
  decision: TrustProofAdmissionDecisionV1;
  requested_capability: string;
  authority_registry?: ReviewerAuthorityRegistryV1;
  review_receipts?: ReviewDecisionReceiptRegistryV1;
}): FinalAdmissionResultV1
```

Result must make admitted/blocked state and exact scope explicit and carry deterministic reasons plus a structural hash.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- FinalAdmissionResolver.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/nucleo/lineage/FinalAdmissionResolver.ts src/nucleo/lineage/FinalAdmissionResolver.test.ts
git commit -m "feat: resolve M62 final admission"
```

### Task 5: Public Surface and End-to-End M62 Contract

**Files:**
- Modify: the existing lineage/public barrel export file discovered in the branch during execution (do not invent a second barrel).
- Create: `src/nucleo/lineage/TrustProofAdmissionGate.integration.test.ts`
- Modify: relevant milestone/project documentation only if the repository's current convention requires it.

**Interfaces:**
- Consumes: all Task 1–4 public APIs.
- Produces: one externally consumable M62 flow without bypassing any verification layer.

- [ ] **Step 1: Locate the existing public export surface**

Run repository search for existing M61 exports and use that same file/pattern. Do not create a parallel export mechanism.

- [ ] **Step 2: Write failing end-to-end integration test**

Construct a valid M61 fixture using existing project helpers, then prove both paths:
`M61 proof → policy → ACCEPT → final admitted`, and
`M61 proof → policy → REVIEW → historical authority → receipt → final admitted`.
Also mutate one artifact in each chain and assert final admission is blocked.

- [ ] **Step 3: Run integration test and verify RED**

Run: `npm test -- TrustProofAdmissionGate.integration.test.ts`
Expected: FAIL until public surface/integration is complete.

- [ ] **Step 4: Export the M62 APIs through the existing public surface**

Export only stable M62 types/functions defined by Tasks 1–4; keep internal hash-chain helpers private unless existing conventions require otherwise.

- [ ] **Step 5: Run integration test and verify GREEN**

Run: `npm test -- TrustProofAdmissionGate.integration.test.ts`
Expected: PASS.

- [ ] **Step 6: Run full verification suite**

Run in order:
`npm test`
`npm run typecheck`
`npm run build`

Expected: all locally executable gates PASS. Record GitHub Actions infrastructure failures separately; do not relabel runner failure as product-test failure or success.

- [ ] **Step 7: Commit Task 5**

```bash
git add src docs
git commit -m "feat: complete M62 trust proof admission gate"
```

## Self-Review Result

- Spec coverage: policy, decisions, REVIEW default, historical reviewer authority, immutable receipts, conflict handling, final admission, scope bounding, fail-closed behavior, and end-to-end consumer path are each owned by a task.
- Type consistency: Tasks 2–4 consume only interfaces introduced by earlier tasks; M61 uses the existing `EndToEndExternalTrustProofV1` and verifier.
- Ambiguity removed: conflicting receipts resolve fail-closed; unlisted capabilities do not auto-accept; original REJECT cannot be overridden.
- Scope: reviewer authority remains M62-specific and does not expand into general IAM.
