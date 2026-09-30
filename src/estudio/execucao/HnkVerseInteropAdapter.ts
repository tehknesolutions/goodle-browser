import type { VerseExecutionRequest } from "../../nucleo/verse/HnkVerseExecutionContract";

export type HnkVerseInteropRequest = {
  sourceRef: string;
  sourceAuthority: "goodle-browser";
  targetContextRef: string;
  contractVersion: "goodle-hnk-verse-interop/v0.1";
  outcome: "TRANSLATE";
  mapperRef: "goodle-hnkir-to-hnk-verse/v0.1";
};

export type HnkVerseInteropOutcome =
  | { kind: "REJECT"; reason: string }
  | { kind: "TRANSLATE"; sourceRef: string; resultRef: string; mapperRef: string };

export function buildHnkVerseInteropRequest(request: VerseExecutionRequest): HnkVerseInteropRequest {
  return {
    sourceRef: request.plan.source_hnkir,
    sourceAuthority: "goodle-browser",
    targetContextRef: request.runtime.canonical_id,
    contractVersion: "goodle-hnk-verse-interop/v0.1",
    outcome: "TRANSLATE",
    mapperRef: "goodle-hnkir-to-hnk-verse/v0.1",
  };
}

export function requireTranslatedInterop(outcome: HnkVerseInteropOutcome): string {
  if (outcome.kind !== "TRANSLATE") {
    throw new Error(`HNK_VERSE_INTEROP_REJECTED: ${outcome.reason}`);
  }
  if (!outcome.resultRef) throw new Error("HNK_VERSE_INTEROP_REJECTED: translated resultRef missing");
  return outcome.resultRef;
}
