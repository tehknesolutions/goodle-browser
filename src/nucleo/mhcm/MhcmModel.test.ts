import { describe, expect, it } from "vitest";
import { validatePath } from "./MhcmModel";

describe("MHCM model", () => {
  it("accepts a deterministic typed path shape", () => {
    expect(validatePath({
      id: "path-1",
      start: "cell-a",
      node_sequence: ["cell-a", "cell-b"],
      edge_sequence: [{ source: "cell-a", target: "cell-b", relation: "next", directed: true }],
      end: "cell-b",
    })).toBe("PASS");
  });

  it("rejects malformed topology", () => {
    expect(validatePath({
      id: "path-2",
      start: "cell-a",
      node_sequence: ["cell-a", "cell-b"],
      edge_sequence: [],
      end: "cell-b",
    })).toBe("FAIL");
  });
});
