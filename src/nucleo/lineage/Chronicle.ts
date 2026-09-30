import type { ArtifactBundle } from "../artefatos/ArtifactContract";
import type { SemanticGraph } from "../grafo/SemanticGraph";
import type { HnkObjectModel } from "../hom/HnkObjectModel";
import type { HnkIRProgram } from "../hnkir/HnkIR";
import type { HnkVersePlan } from "../verse/HnkVerseAdapter";
import type { VerseExecutionRequest, VerseExecutionReceipt } from "../verse/HnkVerseExecutionContract";

export type ChronicleStage = "intent" | "semantic_graph" | "hom" | "hnk_ir" | "verse_plan" | "execution" | "artifact";

export type ChronicleEntry = {
  stage: ChronicleStage;
  ref: string;
  parent_refs: string[];
};

export type Chronicle = {
  schema: "goodle-chronicle/v0.1";
  artifact_ref: string;
  intent_ref?: string;
  entries: ChronicleEntry[];
  complete: boolean;
  missing: ChronicleStage[];
};

export function buildChronicle(input: {
  artifact: ArtifactBundle;
  executionRequest: VerseExecutionRequest;
  executionReceipt: VerseExecutionReceipt;
  versePlan?: HnkVersePlan;
  hnkIR?: HnkIRProgram;
  hom?: HnkObjectModel;
  semanticGraph?: SemanticGraph;
}): Chronicle {
  const entries: ChronicleEntry[] = [];
  const missing: ChronicleStage[] = [];
  const artifact = input.artifact.artifact;

  entries.push({ stage: "artifact", ref: artifact.artifact_id, parent_refs: [artifact.execution_ref, ...artifact.source_operation_refs] });
  entries.push({ stage: "execution", ref: input.executionRequest.request_id, parent_refs: artifact.source_operation_refs });

  if (input.versePlan) entries.push({ stage: "verse_plan", ref: input.versePlan.source_hnkir, parent_refs: input.versePlan.operations.map((op) => op.source_ir) });
  else missing.push("verse_plan");

  if (input.hnkIR) entries.push({ stage: "hnk_ir", ref: input.hnkIR.hom_ref, parent_refs: input.hnkIR.nodes.map((node) => node.id) });
  else missing.push("hnk_ir");

  if (input.hom) entries.push({ stage: "hom", ref: input.hom.graph_ref, parent_refs: input.hom.objects.map((object) => object.id) });
  else missing.push("hom");

  if (input.semanticGraph) entries.push({ stage: "semantic_graph", ref: input.semanticGraph.graph_id, parent_refs: input.semanticGraph.nodes.map((node) => node.id) });
  else missing.push("semantic_graph");

  const intentRef = artifact.intent_ref ?? input.executionRequest.intent_ref ?? input.semanticGraph?.intent_ref;
  if (intentRef) entries.push({ stage: "intent", ref: intentRef, parent_refs: [] });
  else missing.push("intent");

  return {
    schema: "goodle-chronicle/v0.1",
    artifact_ref: artifact.artifact_id,
    intent_ref: intentRef,
    entries,
    complete: missing.length === 0,
    missing,
  };
}

export function traceArtifactToIntent(chronicle: Chronicle): string | undefined {
  return chronicle.entries.find((entry) => entry.stage === "intent")?.ref;
}
