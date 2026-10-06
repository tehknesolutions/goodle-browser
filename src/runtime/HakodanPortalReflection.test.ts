import { describe, expect, it } from "vitest";
import { reflectHakodanPortalState } from "./HakodanPortalReflection";

describe("V2-4 haKodan portal target reflection", () => {
  it("reflects canonical closed state without deciding gameplay semantics", () => {
    expect(reflectHakodanPortalState({ id: "portal-1", state: "closed" })).toEqual({
      id: "portal-1",
      canonicalState: "closed",
      visualState: "closed",
      observable: true,
    });
  });

  it("reflects canonical open state as an open visual", () => {
    expect(reflectHakodanPortalState({ id: "portal-1", state: "open" })).toEqual({
      id: "portal-1",
      canonicalState: "open",
      visualState: "open",
      observable: true,
    });
  });

  it("rejects unsupported state instead of inventing a browser-side transition", () => {
    expect(() => reflectHakodanPortalState({ id: "portal-1", state: "opening" as never })).toThrow(
      "GOODLE_HAKODAN_PORTAL_STATE_INVALID",
    );
  });
});
