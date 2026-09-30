export type MhcmType =
  | "Cell" | "Address" | "Edge" | "Path" | "Glyph"
  | "Transform" | "Composition" | "Type" | "Operator" | "Program";

export type MhcmAddress = {
  namespace: string;
  coordinate: string;
  version: string;
};

export type MhcmCell = {
  id: string;
  address: MhcmAddress;
  layer?: string;
  sector?: string;
  semantic_classification?: string;
  provenance_ref: string;
  schema_version: string;
};

export type MhcmEdge = {
  source: string;
  target: string;
  relation: string;
  directed?: boolean;
};

export type MhcmPath = {
  id: string;
  start: string;
  node_sequence: string[];
  edge_sequence: MhcmEdge[];
  end: string;
  directed?: boolean;
  reversible?: boolean;
  typed?: boolean;
};

export type MhcmGlyph = {
  anchor: string;
  path: string;
  transform: string;
  encoding: string;
  provenance_ref: string;
};

export type MhcmTransform = {
  kind: "rotation" | "reflection" | "reversal" | "translation" | "projection" | "normalization";
  version: string;
};

export function validatePath(path: MhcmPath): "PASS" | "FAIL" {
  if (!path.id || !path.start || !path.end) return "FAIL";
  if (path.node_sequence.length === 0) return "FAIL";
  if (path.edge_sequence.length !== Math.max(0, path.node_sequence.length - 1)) return "FAIL";
  return "PASS";
}
