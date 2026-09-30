import { describe, expect, it } from "vitest";
import { resolveStudioExecutionSource } from "./StudioExecutionController";

describe("Studio execution controller", () => {
  it("uses the editable OldRewrite source as the executable input", () => {
    expect(resolveStudioExecutionSource({
      oldRewrite: "criar entidade Player",
      naturalIntent: "Crie um RPG",
    })).toBe("criar entidade Player");
  });

  it("rejects an empty OldRewrite source instead of executing natural language as code", () => {
    expect(() => resolveStudioExecutionSource({ oldRewrite: "   ", naturalIntent: "Crie um RPG" }))
      .toThrow("OLDREWRITE_REQUIRED");
  });
});
