import { createHash } from "node:crypto";
import type { MaterializedArtifactTree, MaterializedFile } from "../manifestacao/ArtifactMaterializer";
import {
  isSafeWorkspacePath,
  joinSafeWorkspacePath,
} from "../manifestacao/PathSecurity";
import type { BuildAttestationV1 } from "./BuildAttestation";
import { verifyBuildAttestation } from "./BuildAttestation";
import { sha256Json } from "./BuildLedger";

export type TrustedArtifactBundleFileV1 = {
  path: string;
  content: string;
  media_type: MaterializedFile["media_type"];
  sha256: string;
  provenance_refs: string[];
};

export type TrustedArtifactBundleV1 = {
  schema: "goodle.trusted-artifact-bundle.v1";
  bundle_id: string;
  build_id: string;
  logical_build_id: string;
  attestation: BuildAttestationV1;
  entries: string[];
  files: TrustedArtifactBundleFileV1[];
  bundle_hash: string;
};

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function fullPath(tree: MaterializedArtifactTree, path: string): string {
  return joinSafeWorkspacePath(tree.root, path);
}

export function createTrustedArtifactBundle(input: {
  trees: MaterializedArtifactTree[];
  attestation: BuildAttestationV1;
}): TrustedArtifactBundleV1 {
  if (!verifyBuildAttestation(input.attestation)) {
    throw new Error("TRUSTED_BUNDLE_ATTESTATION_INVALID");
  }

  const entries = input.trees.map((tree) => tree.entry).sort((a, b) => a.localeCompare(b));

  for (const entry of entries) {
    if (!input.attestation.artifact_entries.includes(entry)) {
      throw new Error(`TRUSTED_BUNDLE_ENTRY_NOT_ATTESTED: ${entry}`);
    }
  }

  const files = input.trees
    .flatMap((tree) =>
      tree.files.map((file) => ({
        path: fullPath(tree, file.path),
        content: file.content,
        media_type: file.media_type,
        sha256: sha256Text(file.content),
        provenance_refs: [...file.provenance_refs].sort((a, b) => a.localeCompare(b)),
      })),
    )
    .sort((a, b) => a.path.localeCompare(b.path));

  const duplicate = files.find(
    (file, index) => files.findIndex((candidate) => candidate.path === file.path) !== index,
  );
  if (duplicate) {
    throw new Error(`TRUSTED_BUNDLE_DUPLICATE_PATH: ${duplicate.path}`);
  }

  const unsigned = {
    schema: "goodle.trusted-artifact-bundle.v1" as const,
    build_id: input.attestation.build_id,
    logical_build_id: input.attestation.logical_build_id,
    attestation: input.attestation,
    entries,
    files,
  };

  const bundle_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    bundle_id: `bundle-${input.attestation.logical_build_id}-${bundle_hash.slice(0, 12)}`,
    bundle_hash,
  };
}

export function verifyTrustedArtifactBundle(bundle: TrustedArtifactBundleV1): {
  valid: boolean;
  attestation_valid: boolean;
  bundle_hash_valid: boolean;
  files_valid: boolean;
  paths_valid: boolean;
  invalid_files: string[];
  invalid_paths: string[];
} {
  const attestation_valid = verifyBuildAttestation(bundle.attestation);

  const invalid_files = bundle.files
    .filter((file) => sha256Text(file.content) !== file.sha256)
    .map((file) => file.path);

  const invalid_paths = bundle.files
    .filter((file) => !isSafeWorkspacePath(file.path))
    .map((file) => file.path);

  const duplicatePaths = bundle.files
    .filter(
      (file, index, files) =>
        files.findIndex((candidate) => candidate.path === file.path) !== index,
    )
    .map((file) => file.path);

  for (const path of duplicatePaths) {
    if (!invalid_paths.includes(path)) invalid_paths.push(path);
  }

  const {
    bundle_id: _bundleId,
    bundle_hash,
    ...unsigned
  } = bundle;

  const bundle_hash_valid = sha256Json(unsigned) === bundle_hash;
  const files_valid = invalid_files.length === 0;
  const paths_valid = invalid_paths.length === 0;

  return {
    valid:
      attestation_valid &&
      bundle_hash_valid &&
      files_valid &&
      paths_valid,
    attestation_valid,
    bundle_hash_valid,
    files_valid,
    paths_valid,
    invalid_files,
    invalid_paths,
  };
}
