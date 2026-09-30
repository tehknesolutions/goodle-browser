import { describe, expect, it } from "vitest";
import {
  allowEnvironmentTransition,
  assertEnvironmentTransitionAllowed,
  assertReleaseRequirementForEnvironment,
  createEnvironmentPolicyRegistry,
  getTrustedBundlePolicyForEnvironment,
  registerEnvironmentPolicy,
  verifyEnvironmentPolicyRegistry,
} from "./EnvironmentPolicyRegistry";

function baseRegistry() {
  let registry = createEnvironmentPolicyRegistry();

  registry = registerEnvironmentPolicy(registry, {
    environment: "development",
    require_certified: false,
    allow_partial: true,
    allowed_adapters: ["react", "phaser"],
    allowed_kinds: ["web", "game"],
    require_released_manifest: false,
  });

  registry = registerEnvironmentPolicy(registry, {
    environment: "staging",
    require_certified: true,
    allow_partial: false,
    allowed_adapters: ["react"],
    allowed_kinds: ["web"],
    require_released_manifest: false,
  });

  registry = registerEnvironmentPolicy(registry, {
    environment: "production",
    require_certified: true,
    allow_partial: false,
    allowed_adapters: ["react"],
    allowed_kinds: ["web"],
    require_released_manifest: true,
  });

  registry = allowEnvironmentTransition(registry, {
    from: "development",
    to: "staging",
  });

  registry = allowEnvironmentTransition(registry, {
    from: "staging",
    to: "production",
  });

  return registry;
}

describe("M29 Environment Policy Registry", () => {
  it("centralizes environment trust policy", () => {
    const registry = baseRegistry();
    const policy = getTrustedBundlePolicyForEnvironment(
      registry,
      "production",
      { kind: "web", adapter: "react", version: "19" },
    );

    expect(policy).toEqual({
      require_certified: true,
      allow_partial: false,
      expected_adapter: "react",
      expected_kind: "web",
    });
    expect(verifyEnvironmentPolicyRegistry(registry)).toBe(true);
  });

  it("blocks adapters and kinds not allowed by environment", () => {
    const registry = baseRegistry();

    expect(() =>
      getTrustedBundlePolicyForEnvironment(
        registry,
        "production",
        { kind: "game", adapter: "phaser", version: "3" },
      ),
    ).toThrow("ENVIRONMENT_ADAPTER_NOT_ALLOWED");
  });

  it("governs allowed environment transitions", () => {
    const registry = baseRegistry();

    expect(() =>
      assertEnvironmentTransitionAllowed(
        registry,
        "development",
        "staging",
      ),
    ).not.toThrow();

    expect(() =>
      assertEnvironmentTransitionAllowed(
        registry,
        "development",
        "production",
      ),
    ).toThrow("ENVIRONMENT_TRANSITION_NOT_ALLOWED");
  });

  it("requires RELEASED manifest where environment policy demands it", () => {
    const registry = baseRegistry();

    expect(() =>
      assertReleaseRequirementForEnvironment(
        registry,
        "production",
        "RC",
      ),
    ).toThrow("ENVIRONMENT_REQUIRES_RELEASED_MANIFEST");

    expect(() =>
      assertReleaseRequirementForEnvironment(
        registry,
        "production",
        "RELEASED",
      ),
    ).not.toThrow();
  });

  it("detects registry tampering", () => {
    const registry = baseRegistry();

    expect(
      verifyEnvironmentPolicyRegistry({
        ...registry,
        allowed_transitions: [],
      }),
    ).toBe(false);
  });
});
