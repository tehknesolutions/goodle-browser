import { describe, expect, it } from "vitest";
import { parseGoodleCommand } from "./CommandProtocol";

describe("Goodle CLI command protocol", () => {
  it("parses help", () => {
    expect(parseGoodleCommand("help")).toEqual({ kind: "help", args: [] });
  });

  it("parses compile preserving the source text", () => {
    expect(parseGoodleCommand("compile criar entidade Player")).toEqual({
      kind: "compile",
      args: ["criar entidade Player"],
    });
  });

  it("supports the first governed command surface", () => {
    for (const command of ["inspect", "map", "execute", "artifact", "chronicle"] as const) {
      expect(parseGoodleCommand(`${command} ref-1`)).toEqual({ kind: command, args: ["ref-1"] });
    }
  });

  it("does not silently accept unknown commands", () => {
    expect(parseGoodleCommand("teleport Player")).toEqual({
      kind: "unknown",
      args: ["teleport Player"],
    });
  });
});
