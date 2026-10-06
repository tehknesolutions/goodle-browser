import { describe, expect, it } from "vitest";
import { createHakodanPortalVisualProof } from "./HakodanPortalBrowserProof";

describe("V2-4 observable haKodan portal proof", () => {
  it("describes closed manifestation intent without claiming rendering", () => {
    expect(createHakodanPortalVisualProof({ id: "portal-1", state: "closed" })).toEqual({
      id: "portal-1",
      canonicalState: "closed",
      visualState: "closed",
      rendered: false,
      manifestation: "portal-closed",
    });
  });

  it("describes open manifestation intent without claiming rendering", () => {
    expect(createHakodanPortalVisualProof({ id: "portal-1", state: "open" })).toEqual({
      id: "portal-1",
      canonicalState: "open",
      visualState: "open",
      rendered: false,
      manifestation: "portal-open",
    });
  });
});
