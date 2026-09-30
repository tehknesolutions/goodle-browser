import { createArtifactBundle, type ArtifactKind } from "../../nucleo/artefatos/ArtifactContract";
import { compileOldRewrite, type CompilerResult } from "../../nucleo/compiler/CompilerContract";
import type { SemanticGraph } from "../../nucleo/grafo/SemanticGraph";
import { semanticGraphToHom } from "../../nucleo/hom/HnkObjectModel";
import { homToHnkIR } from "../../nucleo/hnkir/HnkIR";
import { buildChronicle } from "../../nucleo/lineage/Chronicle";
import { hnkIRToVersePlan, type HnkVersePlan } from "../../nucleo/verse/HnkVerseAdapter";
import { createVerseExecutionReceipt, type VerseExecutionRequest } from "../../nucleo/verse/HnkVerseExecutionContract";
import type { CapabilityGrant } from "../../nucleo/contratos/HnkEcosystemContracts";
import { authorizeVerseExecution } from "../../nucleo/verse/HnkVerseExecutionEvidence";
import type { StudioManifestation } from "../chronicle/ManifestationRegistry";

export type StudioRuntimeExecutor = (request: VerseExecutionRequest) => Promise<{
  status: "executed" | "failed";
  artifact_id: string;
  artifact_kind: ArtifactKind;
  uri?: string;
  digest?: string;
  executed_at: string;
}>;

export type PreparedStudioExecution = {
  intentId: string;
  compiler: CompilerResult;
  semanticGraph: SemanticGraph;
  versePlan: HnkVersePlan;
  request: VerseExecutionRequest;
  hom: ReturnType<typeof semanticGraphToHom>;
  hnkIR: ReturnType<typeof homToHnkIR>;
};

export function prepareStudioExecution(input: {
  intent: string;
  now: string;
  intentId?: string;
  project_ref?: string;
}): PreparedStudioExecution {
  const intentId = input.intentId ?? `intent-${crypto.randomUUID()}`;
  const compiler = compileOldRewrite(input.intent, { intent_ref: intentId, project_ref: input.project_ref });
  if (!compiler.executable || !compiler.semantic_graph) {
    const details = compiler.diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`).join("; ");
    throw new Error(`COMPILATION_REJECTED: ${details || "compiler produced no executable Semantic Graph"}`);
  }

  const semanticGraph = compiler.semantic_graph;
  const hom = semanticGraphToHom(semanticGraph);
  const hnkIR = homToHnkIR(hom);
  const versePlan = hnkIRToVersePlan(hnkIR);
  const request: VerseExecutionRequest = {
    request_id: `exec-${crypto.randomUUID()}`,
    principal: { canonical_id: "agent:goodle", actor_type: "agent" },
    runtime: { canonical_id: "service:hnk-verse", actor_type: "service" },
    plan: versePlan,
    intent_ref: intentId,
    project_ref: input.project_ref,
    requested_at: input.now,
  };
  return { intentId, compiler, semanticGraph, hom, hnkIR, versePlan, request };
}

export async function executeStudioIntent(input: {
  intent: string;
  grants: readonly CapabilityGrant[];
  runtimeExecutor: StudioRuntimeExecutor;
  now: string;
  project_ref?: string;
}): Promise<StudioManifestation> {
  const prepared = prepareStudioExecution(input);
  const { request, versePlan, hnkIR, hom, semanticGraph } = prepared;

  authorizeVerseExecution(request, input.grants);
  const admission = createVerseExecutionReceipt(request);
  if (admission.status !== "accepted") {
    throw new Error(`EXECUTION_REJECTED: ${admission.rejected_operations.map((item) => item.reason).join("; ")}`);
  }

  const runtimeResult = await input.runtimeExecutor(request);
  if (runtimeResult.status !== "executed") throw new Error("RUNTIME_FAILED: HNK-VERSE did not execute the plan");
  const receipt = { ...admission, status: "executed" as const, executed_at: runtimeResult.executed_at };
  const artifact = createArtifactBundle(request, receipt, {
    artifact_id: runtimeResult.artifact_id,
    kind: runtimeResult.artifact_kind,
    created_at: runtimeResult.executed_at,
    uri: runtimeResult.uri,
    digest: runtimeResult.digest,
  });
  const chronicle = buildChronicle({ artifact, executionRequest: request, executionReceipt: receipt, versePlan, hnkIR, hom, semanticGraph });
  return { artifact, chronicle };
}
