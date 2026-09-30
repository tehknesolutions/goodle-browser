import { describe, expect, it } from "vitest";
import { createStudioDraft, updateStudioDraft } from "./StudioDraftState";

describe("GoodStudio draft state", () => {
  it("starts with explicit editable sources", () => {
    expect(createStudioDraft()).toEqual({ oldRewrite: "", naturalIntent: "" });
  });

  it("updates OldRewrite without overwriting natural intent", () => {
    const draft = updateStudioDraft({ oldRewrite: "", naturalIntent: "Crie um RPG" }, { oldRewrite: "criar entidade Player" });
    expect(draft).toEqual({ oldRewrite: "criar entidade Player", naturalIntent: "Crie um RPG" });
  });
});
