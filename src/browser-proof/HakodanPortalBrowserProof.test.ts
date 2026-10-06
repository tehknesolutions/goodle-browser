import { describe, expect, it } from "vitest";
import { createHakodanPortalVisualProof } from "./HakodanPortalBrowserProof";

describe("V2-4 observable haKodan portal proof", () => {
  it("publishes closed canonical and rendered state together", () => {
    expect(createHakodanPortalVisualProof({ id: "portal-1", state: "closed" })).toEqual({
      id: "portal-1",
      canonicalState: "closed",
      visualState: "closed",
      rendered: true,
      manifestation: "portal-closed",
    });
  });

  it("publishes open canonical and rendered state together", () => {
    expect(createHakodanPortalVisualProof({ id: "portal-1", state: "open" })).toEqual({
      id: "portal-1",
      canonicalState: "open",
      visualState: "open",
      rendered: true,
      manifestation: "portal-open",
    });
  });
});
