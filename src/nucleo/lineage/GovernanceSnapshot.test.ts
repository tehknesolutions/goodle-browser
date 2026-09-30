import { describe, expect, it } from "vitest";
import {
  allowEnvironmentTransition,
  createEnvironmentPolicyRegistry,
  registerEnvironmentPolicy,
} from "./EnvironmentPolicyRegistry";
import {
  createGovernanceSnapshot,
  verifyGovernanceSnapshot,
} from "./GovernanceSnapshot";

function registry() {
  let value = createEnvironmentPolicyRegistry();

  value = registerEnvironmentPolicy(value, {
    environment: "staging",
    require_certified: true,
    allow_partial: false,
    allowed_adapters: ["react"],
    allowed_kinds: ["web"],
    require_released_manifest: false,
  });

  value = registerEnvironmentPolicy(value, {
    environment: "production",
    require_certified: true,
    allow_partial: false,
    allowed_adapters: ["react"],
    allowed_kinds: ["web"],
    require_released_manifest: true,
  });

  return allowEnvironmentTransition(value, {
    from: "staging",
    to: "production",
  });
}

describe("M31 Governance Snapshot", () => {
  it("captures immutable policy identity for an operation", () => {
    const snap = createGovernanceSnapshot({
      registry: registry(),
      operation: "PRODUCTION_RELEASE",
      source_environment: "staging",
      destination_environment: "production",
      target: { kind: "web", adapter: "react", version: "19" },
      release_status: "RELEASED",
    });

    expect(snap).toMatchObject({
      schema: "goodle.governance-snapshot.v1",
      operation: "PRODUCTION_RELEASE",
      destination_environment: "production",
      release_status: "RELEASED",
      transition: {
        from: "staging",
        to: "production",
        allowed: true,
      },
    });
    expect(verifyGovernanceSnapshot(snap)).toBe(true);
  });

  it("changes identity when policy registry changes", () => {
    const firstRegistry = registry();
    const first = createGovernanceSnapshot({
      registry: firstRegistry,
      operation: "DEPLOY",
      destination_environment: "staging",
      target: { kind: "web", adapter: "react", version: "19" },
    });

    const changedRegistry = registerEnvironmentPolicy(firstRegistry, {
      environment: "staging",
      require_certified: true,
      allow_partial: false,
      allowed_adapters: ["react", "phaser"],
      allowed_kinds: ["web"],
      require_released_manifest: false,
    });

    const second = createGovernanceSnapshot({
      registry: changedRegistry,
      operation: "DEPLOY",
      destination_environment: "staging",
      target: { kind: "web", adapter: "react", version: "19" },
    });

    expect(second.snapshot_hash).not.toBe(first.snapshot_hash);
    expect(second.registry_hash).not.toBe(first.registry_hash);
  });

  it("detects snapshot tampering", () => {
    const snap = createGovernanceSnapshot({
      registry: registry(),
      operation: "DEPLOY",
      destination_environment: "staging",
      target: { kind: "web", adapter: "react", version: "19" },
    });

    expect(
      verifyGovernanceSnapshot({
        ...snap,
        destination_environment: "production",
      }),
    ).toBe(false);
  });
});
