import type { GoodleIRNode, GoodleIRPrograma } from "../ir/GoodleIR";
import {
  resolveTargetCapability,
  type TargetEvidenceLevel,
  type TargetSupportStatus,
} from "./TargetCapabilityRegistry";

export type ManifestationKind =
  | "code" | "web" | "app" | "game" | "world" | "ui"
  | "mockup" | "wireframe" | "doc" | "gdd" | "pdd"
  | "image" | "video" | "audio" | "prompt" | "agent" | "workflow";

export type ManifestationTarget = {
  target_id: string;
  kind: ManifestationKind;
  adapter: string;
  version: string;
  source_ir: string;
  provenance_refs: string[];
  support_status: TargetSupportStatus;
  capability_refs: string[];
  capability_evidence?: TargetEvidenceLevel;
  unsupported_reason?: "UNKNOWN_ADAPTER" | "UNSUPPORTED_KIND" | "UNSUPPORTED_VERSION";
};

export type ManifestationGraph = {
  program_version: GoodleIRPrograma["versao"];
  source_nodes: string[];
  targets: ManifestationTarget[];
};

export function createManifestationTarget(
  node: GoodleIRNode,
  kind: ManifestationKind,
  adapter: string,
  version: string,
): ManifestationTarget {
  const resolution = resolveTargetCapability({ kind, adapter, version });

  return {
    target_id: `manifest-${node.id}-${kind}`,
    kind,
    adapter,
    version,
    source_ir: node.id,
    provenance_refs: [node.id],
    support_status: resolution.status,
    capability_refs: resolution.capabilities,
    capability_evidence: resolution.evidence,
    unsupported_reason: resolution.reason,
  };
}
