import { describe, expect, it } from "vitest";
import {
  resolveTargetCapability,
  targetHasRuntimeEvidence,
  targetIsSupported,
} from "./TargetCapabilityRegistry";

describe("Target Capability Registry V1", () => {
  it("declares React web as runtime-supported", () => {
    const result = resolveTargetCapability({ kind: "web", adapter: "react", version: "19.1.0" });

    expect(result).toMatchObject({
      status: "SUPPORTED",
      target_id: "react-web-v19",
      evidence: "RUNTIME",
    });
    expect(result.capabilities).toContain("web.render");
    expect(targetHasRuntimeEvidence({ kind: "web", adapter: "react", version: "19.1.0" })).toBe(true);
  });

  it("declares HNK-VERSE world integration as contract-supported without claiming runtime proof", () => {
    const request = { kind: "world" as const, adapter: "hnk-verse", version: "0.1" };
    const result = resolveTargetCapability(request);

    expect(result).toMatchObject({
      status: "SUPPORTED",
      target_id: "hnk-verse-world-v0.1",
      evidence: "CONTRACT",
    });
    expect(targetIsSupported(request)).toBe(true);
    expect(targetHasRuntimeEvidence(request)).toBe(false);
  });

  it("returns UNSUPPORTED when an adapter does not support the requested manifestation kind", () => {
    expect(resolveTargetCapability({ kind: "video", adapter: "react", version: "19" })).toMatchObject({
      status: "UNSUPPORTED",
      reason: "UNSUPPORTED_KIND",
    });
  });

  it("returns UNSUPPORTED for unknown adapters", () => {
    expect(resolveTargetCapability({ kind: "web", adapter: "unknown-target", version: "1" })).toEqual({
      status: "UNSUPPORTED",
      adapter: "unknown-target",
      version: "1",
      kind: "web",
      capabilities: [],
      reason: "UNKNOWN_ADAPTER",
    });
  });

  it("returns UNSUPPORTED for incompatible versions", () => {
    expect(resolveTargetCapability({ kind: "world", adapter: "hnk-verse", version: "1.0" })).toMatchObject({
      status: "UNSUPPORTED",
      reason: "UNSUPPORTED_VERSION",
    });
  });
});
