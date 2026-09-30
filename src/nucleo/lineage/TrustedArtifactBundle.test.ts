import { describe, expect, it } from "vitest";
import type { MaterializedArtifactTree } from "../manifestacao/ArtifactMaterializer";
import type { BuildAttestationV1 } from "./BuildAttestation";
import { sha256Json } from "./BuildLedger";
import {
  createTrustedArtifactBundle,
  verifyTrustedArtifactBundle,
} from "./TrustedArtifactBundle";

const tree: MaterializedArtifactTree = {
  root: ".goodle/generated",
  entry: ".goodle/generated/src/generated/GoodleArtifact.tsx",
  files: [
    {
      path: "src/generated/GoodleArtifact.tsx",
      content: "export const GoodleArtifact = true;\n",
      media_type: "text/tsx",
      provenance_refs: ["node-1"],
    },
    {
      path: "manifest.json",
      content: "{}\n",
      media_type: "application/json",
      provenance_refs: ["node-1"],
    },
    {
      path: "provenance.json",
      content: "{}\n",
      media_type: "application/json",
      provenance_refs: ["node-1"],
    },
  ],
  manifest: {
    schema: "goodle.artifact-manifest.v1",
    execution_id: "exec-1",
    target_id: "target-1",
    source_ir: "node-1",
    adapter: "react",
    version: "19",
    kind: "web",
    entry: "src/generated/GoodleArtifact.tsx",
    files: ["src/generated/GoodleArtifact.tsx", "manifest.json", "provenance.json"],
  },
  provenance: {
    schema: "goodle.provenance.v1",
    execution_id: "exec-1",
    source_ir: "node-1",
    target_id: "target-1",
    provenance_refs: ["node-1"],
  },
};

function attestation(entries = [tree.entry]): BuildAttestationV1 {
  const unsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: "build-1",
    logical_build_id: "rbi-1234567890abcdef",
    graph_id: "graph-1",
    target: { kind: "web" as const, adapter: "react", version: "19" },
    certification_status: "CERTIFIED" as const,
    trust: {
      report_hash: "report",
      certification_hash: "cert",
      ledger_hash: "ledger",
      identity_hash: "identity",
    },
    provenance_refs: ["node-1"],
    artifact_entries: entries,
  };

  const envelope_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    attestation_id: `attest-rbi-1234567890abcdef-${envelope_hash.slice(0, 12)}`,
    envelope_hash,
  };
}

describe("M20 Trusted Artifact Bundle", () => {
  it("bundles attested files with deterministic hashes", () => {
    const bundle = createTrustedArtifactBundle({
      trees: [tree],
      attestation: attestation(),
    });

    expect(bundle.schema).toBe("goodle.trusted-artifact-bundle.v1");
    expect(bundle.files).toHaveLength(3);
    expect(bundle.entries).toEqual([tree.entry]);
    expect(verifyTrustedArtifactBundle(bundle)).toMatchObject({
      valid: true,
      attestation_valid: true,
      bundle_hash_valid: true,
      files_valid: true,
      invalid_files: [],
    });
  });

  it("detects file tampering", () => {
    const bundle = createTrustedArtifactBundle({
      trees: [tree],
      attestation: attestation(),
    });

    const tampered = {
      ...bundle,
      files: bundle.files.map((file, index) =>
        index === 0 ? { ...file, content: file.content + "// tampered\n" } : file,
      ),
    };

    const verification = verifyTrustedArtifactBundle(tampered);
    expect(verification.valid).toBe(false);
    expect(verification.files_valid).toBe(false);
    expect(verification.invalid_files).toContain(
      ".goodle/generated/manifest.json",
    );
  });

  it("rejects artifact entries not covered by a valid attestation", () => {
    expect(() =>
      createTrustedArtifactBundle({
        trees: [tree],
        attestation: attestation([]),
      }),
    ).toThrow(
      "TRUSTED_BUNDLE_ENTRY_NOT_ATTESTED: .goodle/generated/src/generated/GoodleArtifact.tsx",
    );
  });

  it("rejects duplicate full paths across trees", () => {
    expect(() =>
      createTrustedArtifactBundle({
        trees: [tree, tree],
        attestation: attestation(),
      }),
    ).toThrow("TRUSTED_BUNDLE_DUPLICATE_PATH");
  });
});
