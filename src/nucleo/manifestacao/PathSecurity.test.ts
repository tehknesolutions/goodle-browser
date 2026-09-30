import { describe, expect, it } from "vitest";
import {
  joinSafeWorkspacePath,
  normalizeSafeRelativePath,
  normalizeSafeWorkspaceRoot,
} from "./PathSecurity";

describe("M40 Path Security", () => {
  it("normalizes safe relative workspace paths", () => {
    expect(normalizeSafeRelativePath("src\\app.ts")).toBe("src/app.ts");
    expect(normalizeSafeWorkspaceRoot(".goodle/generated/")).toBe(".goodle/generated");
    expect(joinSafeWorkspacePath(".goodle/generated", "src/app.ts")).toBe(
      ".goodle/generated/src/app.ts",
    );
  });

  it.each([
    "../escape.ts",
    "a/../escape.ts",
    "/absolute/path.ts",
    "C:\\escape.ts",
    "C:/escape.ts",
    "\\\\server\\share\\file.ts",
    "//server/share/file.ts",
    "./relative.ts",
    "a//b.ts",
  ])("rejects unsafe path %s", (path) => {
    expect(() => normalizeSafeRelativePath(path)).toThrow(
      "UNSAFE_PROJECT_PATH",
    );
  });

  it("rejects unsafe workspace roots", () => {
    expect(() => normalizeSafeWorkspaceRoot("../outside")).toThrow(
      "UNSAFE_PROJECT_PATH",
    );
    expect(() => normalizeSafeWorkspaceRoot("/tmp/output")).toThrow(
      "UNSAFE_PROJECT_PATH",
    );
  });
});
