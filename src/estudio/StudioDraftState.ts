export type StudioDraft = {
  oldRewrite: string;
  naturalIntent: string;
};

export function createStudioDraft(): StudioDraft {
  return { oldRewrite: "", naturalIntent: "" };
}

export function updateStudioDraft(current: StudioDraft, patch: Partial<StudioDraft>): StudioDraft {
  return { ...current, ...patch };
}
