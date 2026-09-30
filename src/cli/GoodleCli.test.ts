import { describe, expect, it } from "vitest";
import { runGoodleCli } from "./GoodleCli";

describe("Goodle CLI", () => {
  it("renders help for --help", () => {
    const result = runGoodleCli(["--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Goodle CLI");
    expect(result.stdout).toContain("compile <intent|OldRewrite>");
  });

  it("accepts compile intent from the native command line", () => {
    const result = runGoodleCli(["compile", "criar entidade Player"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("compile");
    expect(result.stdout).toContain("criar entidade Player");
  });

  it("rejects unknown commands", () => {
    const result = runGoodleCli(["teleport", "Player"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("UNKNOWN_COMMAND");
  });
});
