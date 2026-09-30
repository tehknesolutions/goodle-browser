import { describe, expect, it } from "vitest";
import { parseBuildArgs } from "./goodle-build";

describe("M14 build CLI", () => {
  it("defaults to dry-run and deny overwrite", () => {
    expect(parseBuildArgs([
      "--graph", "graph.json",
      "--kind", "web",
      "--adapter", "react",
      "--version", "19",
    ])).toMatchObject({
      graphPath: "graph.json",
      kind: "web",
      adapter: "react",
      version: "19",
      mode: "DRY_RUN",
      overwrite: "DENY",
    });
  });

  it("enables apply and overwrite only explicitly", () => {
    expect(parseBuildArgs([
      "--graph", "graph.json",
      "--kind", "game",
      "--adapter", "phaser",
      "--version", "3",
      "--apply",
      "--overwrite",
      "--root", "generated",
    ])).toMatchObject({
      mode: "APPLY",
      overwrite: "ALLOW",
      root: "generated",
    });
  });

  it("rejects conflicting modes", () => {
    expect(() => parseBuildArgs([
      "--graph", "graph.json",
      "--kind", "web",
      "--adapter", "react",
      "--version", "19",
      "--apply",
      "--dry-run",
    ])).toThrow("BUILD_MODE_CONFLICT");
  });
});
