import { describe, expect, it } from "vitest";
import { readHakodanPortalInput } from "./HakodanPortalInput";

describe("V2-4 dynamic haKodan portal input bridge", () => {
  it("reads canonical portal state supplied by the host", () => {
    expect(readHakodanPortalInput({ id: "portal-7", state: "closed" })).toEqual({ id: "portal-7", state: "closed" });
    expect(readHakodanPortalInput({ id: "portal-7", state: "open" })).toEqual({ id: "portal-7", state: "open" });
  });

  it("rejects missing or unsupported host state instead of inventing a browser default", () => {
    expect(() => readHakodanPortalInput(undefined)).toThrow("GOODLE_HAKODAN_PORTAL_INPUT_MISSING");
    expect(() => readHakodanPortalInput({ id: "portal-7", state: "opening" })).toThrow("GOODLE_HAKODAN_PORTAL_STATE_INVALID");
  });
});
