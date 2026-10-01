import { describe, expect, it } from "vitest";
import { parseOldRewrite } from "./ParserOldRewrite";
describe("M86 — collision resolution", () => {
  it("converge resolver colisões", () => {
    expect(parseOldRewrite("resolver colisões").nos[0]).toMatchObject({ semantica: "fisica.colisao_resolver" });
  });
});
