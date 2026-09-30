import { createArtifactBundle, type ArtifactKind } from "../../nucleo/artefatos/ArtifactContract";
import { addSemanticNode, createSemanticGraph } from "../../nucleo/grafo/SemanticGraph";
import { semanticGraphToHom } from "../../nucleo/hom/HnkObjectModel";
import { homToHnkIR } from "../../nucleo/hnkir/HnkIR";
import { buildChronicle } from "../../nucleo/lineage/Chronicle";
import { hnkIRToVersePlan } from "../../nucleo/verse/HnkVerseAdapter";
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

export async function executeStudioIntent(input: {
  intent: string;
  grants: readonly CapabilityGrant[];
  runtimeExecutor: StudioRuntimeExecutor;
  now: string;
}): Promise<StudioManifestation> {
  const intentId = `intent-${crypto.randomUUID()}`;
  let semanticGraph = createSemanticGraph(`graph-${crypto.randomUUID()}`);
  semanticGraph.intent_ref = intentId;
  semanticGraph = addSemanticNode(semanticGraph, {
    id: intentId,
    semantic_id: "intent.user",
    kind: "intent",
    label: input.intent,
    authority: "PROPOSED",
    provenance_refs: [intentId],
    attributes: { text: input.intent },
  });

  // Parsing semântico completo é responsabilidade do compilador/Good AI.
  // Sem saída compilada validada, a intenção permanece UNRESOLVED e não é inventada aqui.
  const hom = semanticGraphToHom(semanticGraph);
  const hnkIR = homToHnkIR(hom);
  const versePlan = hnkIRToVersePlan(hnkIR);
  const request: VerseExecutionRequest = {
    request_id: `exec-${crypto.randomUUID()}`,
    principal: { canonical_id: "agent:goodle", actor_type: "agent" },
    runtime: { canonical_id: "service:hnk-verse", actor_type: "service" },
    plan: versePlan,
    intent_ref: intentId,
    requested_at: input.now,
  };

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
