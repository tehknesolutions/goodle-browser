# M75 — Reproducible Artifact Identity

## Purpose

M75 adds deterministic identity to Goodle artifacts without replacing the M74 independent verification and signed quality-attestation chain.

## Contract

For a logical artifact, identity is derived only from canonical artifact files:

1. each file contributes its path and content;
2. file order is normalized before hashing;
3. volatile build metadata is excluded from identity;
4. any content or path change changes identity;
5. the resulting identifier is explicit as `sha256:<hex>`.

## Boundary

M75 answers: **do two equivalent artifact inputs have the same identity?**

M74 / quality attestations answer separate questions about independent verification, integrity evidence and signatures.

## CI status

Remote GitHub Actions execution remains independently blocked/tracked in #140. M75 must not be described as remotely CI-green until runner evidence exists.
