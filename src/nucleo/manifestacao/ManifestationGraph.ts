import type { GoodleIRNode, GoodleIRPrograma } from "../ir/GoodleIR";

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
  return {
    target_id: `manifest-${node.id}-${kind}`,
    kind,
    adapter,
    version,
    source_ir: node.id,
    provenance_refs: [node.id],
  };
}
