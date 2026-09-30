# M62 — Trust Proof Consumer / Admission Gate Design

## Status
Design approved for formal review. Implementation is not authorized by this document alone.

## Purpose
M62 consumes the portable End-to-End External Trust Proof produced by M61 and converts independently verified evidence into an operational admission decision without weakening the trust chain established by M55–M61.

## Core Flow

`M61 Proof → Independent Verification → Versioned Admission Policy → ACCEPT | REVIEW | REJECT`

For review-required cases:

`REVIEW → Historical Reviewer Authority Check → Human Decision → Review Decision Receipt → Final Admission`

## Design Principles

1. **Fail closed by default.** Unknown state, verification error, missing authority, malformed policy, inconsistent evidence, or internal error MUST NOT produce ACCEPT.
2. **Never trust stored conclusions blindly.** M62 invokes M61 verification and bases admission on verified evidence plus an explicit policy.
3. **Evidence is immutable.** M62 never rewrites the M61 proof, compliance receipt, signature, registry, key history, or historical binding.
4. **Policy is explicit and versioned.** Every admission decision binds to a concrete `policy_id` and `policy_version`.
5. **Human review creates new evidence.** A reviewer decision is represented by a separate append-only, hash-verifiable Review Decision Receipt.
6. **Authority is historical.** Reviewer authorization is evaluated at the decision point. Later revocation does not erase decisions that were legitimately authorized when made.
7. **No silent escalation.** REVIEW never becomes ACCEPT merely because data is absent, ambiguous, or an exception occurs.

## Admission Outcomes

### ACCEPT
The proof is valid and the selected admission policy explicitly permits the requested operation/capability.

ACCEPT authorizes only the scope stated by the policy. It is not a universal trust grant.

### REVIEW
The proof is valid, but policy requires human authority or does not permit automatic admission.

REVIEW is fail-closed by default. A policy MAY explicitly allow narrowly scoped low-risk capabilities while review is pending, but such permissions must be positively enumerated. Absence of an explicit permission means blocked.

### REJECT
Admission is denied. REJECT is mandatory when the M61 proof is invalid, tampered, inconsistent, cryptographically invalid, historically untrusted, or otherwise fails M61 verification. Policy-level denial also produces REJECT.

## Admission Policy

Proposed schema identifier:

`goodle.trust-proof-admission-policy.v1`

Minimum identity fields:
- `policy_id`
- `policy_version`
- policy structural hash

The policy defines:
- automatic acceptance conditions;
- conditions requiring review;
- explicit rejection conditions;
- operation/capability scope;
- optional explicitly enumerated capabilities permitted while REVIEW is pending.

Policies MUST NOT override failed M61 verification. An invalid proof cannot be promoted by policy or human review.

## Admission Decision

Proposed schema identifier:

`goodle.trust-proof-admission-decision.v1`

A decision binds at minimum:
- M61 `proof_id`;
- M61 proof structural hash;
- `policy_id`;
- `policy_version`;
- policy structural hash;
- outcome: `ACCEPT | REVIEW | REJECT`;
- requested operation/capability scope;
- deterministic reasons;
- decision structural hash.

The decision is derived data. Verification MUST be able to recompute the relevant decision inputs rather than trusting the stored outcome alone.

## Reviewer Authority

A reviewer identity MUST NOT be accepted merely because a caller supplies a `reviewer_id`.

Reviewer authority must come from a pre-existing, integrity-verifiable authority registry with historical state. The authority model must support at least:
- registration/authorization;
- revocation;
- historical lookup at a specific registry sequence or equivalent immutable point;
- tamper-evident history.

A review decision is valid only if the reviewer possessed the required authority for the relevant admission scope at the recorded historical point.

Later revocation prevents prospective authority but does not retroactively invalidate a receipt that was validly authorized at its historical point.

## Review Decision Receipt

Proposed schema identifier:

`goodle.review-decision-receipt.v1`

The receipt is a new immutable artifact and MUST NOT mutate the M61 proof or original admission decision.

It binds at minimum:
- `proof_id`;
- proof structural hash;
- `policy_id`;
- `policy_version`;
- policy structural hash;
- original REVIEW decision hash;
- reviewer identity;
- reviewer-authority historical reference;
- human decision;
- exact admitted/denied scope;
- deterministic reason/justification field;
- receipt structural hash.

Receipts are stored in an append-only, tamper-evident history. Duplicate/conflicting handling must be deterministic and must never silently select the more permissive receipt.

## Final Admission

Final admission consumes the original M62 decision and, when required, a valid Review Decision Receipt.

Rules:
- original ACCEPT → admitted only for its explicit scope;
- original REJECT → cannot be overridden by reviewer authority;
- original REVIEW without valid receipt → blocked except for capabilities explicitly permitted by policy during pending review;
- original REVIEW with valid authorized receipt → final scope follows the receipt, bounded by the policy and requested scope;
- malformed, stale, mismatched, unauthorized, or tampered receipt → blocked;
- any unexpected evaluation failure → blocked.

Human review therefore resolves REVIEW; it does not override cryptographic or structural failure and cannot transform an invalid proof into trusted evidence.

## Integrity Boundaries

M62 must verify identity consistency across proof, policy, admission decision, authority history, review receipt, and requested operation. Hash references are exact; semantically similar but byte/structure-different artifacts are not interchangeable.

No component may mutate upstream evidence to make a downstream verification pass.

## API Surface — Proposed

Names are fixed for implementation planning unless codebase conventions discovered during planning require a narrowly documented adjustment:

- `createTrustProofAdmissionPolicy()`
- `verifyTrustProofAdmissionPolicy()`
- `evaluateTrustProofAdmission()`
- `verifyTrustProofAdmissionDecision()`
- `createReviewerAuthorityRegistry()`
- `authorizeReviewer()`
- `revokeReviewer()`
- `verifyReviewerAuthorityRegistry()`
- `reviewerWasAuthorizedAtSequence()`
- `createReviewDecisionReceipt()`
- `verifyReviewDecisionReceipt()`
- `resolveFinalAdmission()`

## Required Security Tests

Implementation must prove at least:
- valid M61 proof + accepting policy → ACCEPT;
- valid proof + review policy → REVIEW and blocked by default;
- valid proof + explicit pending-review low-risk scope → only that scope is permitted;
- valid proof + rejecting policy → REJECT;
- tampered/invalid M61 proof → REJECT regardless of policy;
- malformed/unknown policy → never ACCEPT;
- stored decision tampering is detected by recomputation/hash verification;
- arbitrary reviewer id without authority fails;
- authorized reviewer at historical sequence succeeds for REVIEW;
- reviewer revoked before decision fails;
- reviewer revoked after a historically valid decision does not erase that historical validity;
- review receipt bound to another proof/policy/version/decision fails;
- review cannot override original REJECT;
- review cannot expand beyond policy/requested scope;
- conflicting receipts fail closed or resolve deterministically to a non-more-permissive result;
- any corrupted authority history fails closed.

## Non-Goals

M62 does not redesign M55–M61, replace Ed25519, rewrite compliance policy, introduce network identity infrastructure, or create a general-purpose IAM platform. Reviewer authority exists only to support admission review required by this milestone.

## Acceptance Boundary

M62 is complete when an external consumer can take an M61 proof and a concrete versioned policy and obtain a deterministic, independently verifiable operational result, including historically auditable human resolution of REVIEW, while every invalid/unknown path remains fail-closed.