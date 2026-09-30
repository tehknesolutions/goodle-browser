import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { TrustedArtifactBundleV1 } from "./TrustedArtifactBundle";
import { sha256Json } from "./BuildLedger";
import {
  assertTrustedDeploymentAuthorized,
  authorizeTrustedDeployment,
  verifyTrustedDeploymentReceipt,
} from "./TrustedDeploymentGate";

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function bundle(certification_status: "CERTIFIED" | "PARTIAL" | "REJECTED" = "CERTIFIED"): TrustedArtifactBundleV1 {
  const attestationUnsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: "build-deploy",
    logical_build_id: "rbi-deploy",
    graph_id: "graph-deploy",
    target: { kind: "web" as const, adapter: "react", version: "19" },
    certification_status,
    trust: {
      report_hash: "report",
      certification_hash: "cert",
      ledger_hash: "ledger-hash",
      identity_hash: "identity",
    },
    provenance_refs: ["prov-1"],
    artifact_entries: [".goodle/generated/entry.tsx"],
  };

  const envelope_hash = sha256Json(attestationUnsigned);
  const attestation = {
    ...attestationUnsigned,
    attestation_id: `attest-${envelope_hash.slice(0, 12)}`,
    envelope_hash,
  };

  const file = {
    path: ".goodle/generated/entry.tsx",
    content: "export const deployable = true;\n",
    media_type: "text/tsx" as const,
    sha256: sha256Text("export const deployable = true;\n"),
    provenance_refs: ["prov-1"],
  };

  const unsigned = {
    schema: "goodle.trusted-artifact-bundle.v1" as const,
    build_id: "build-deploy",
    logical_build_id: "rbi-deploy",
    attestation,
    entries: [".goodle/generated/entry.tsx"],
    files: [file],
  };

  const bundle_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    bundle_id: `bundle-${bundle_hash.slice(0, 12)}`,
    bundle_hash,
  };
}

describe("M22 Trusted Deployment Gate", () => {
  it("authorizes deploy for an accepted bundle and emits a verifiable receipt", () => {
    const receipt = authorizeTrustedDeployment({
      action: "DEPLOY",
      environment: "production",
      bundle: bundle(),
      policy: {
        expected_adapter: "react",
        expected_kind: "web",
      },
    });

    expect(receipt).toMatchObject({
      status: "AUTHORIZED",
      action: "DEPLOY",
      environment: "production",
      ledger_hash: "ledger-hash",
    });
    expect(receipt.verification.decision).toBe("ACCEPTED");
    expect(verifyTrustedDeploymentReceipt(receipt)).toBe(true);
    expect(() => assertTrustedDeploymentAuthorized(receipt)).not.toThrow();
  });

  it("blocks deployment for quarantined bundles", () => {
    const receipt = authorizeTrustedDeployment({
      action: "DEPLOY",
      environment: "production",
      bundle: bundle("PARTIAL"),
    });

    expect(receipt.status).toBe("BLOCKED");
    expect(receipt.verification.decision).toBe("QUARANTINED");
    expect(() => assertTrustedDeploymentAuthorized(receipt)).toThrow(
      "TRUSTED_DEPLOYMENT_BLOCKED",
    );
  });

  it("blocks import when integrity is broken", () => {
    const original = bundle();
    const tampered = {
      ...original,
      files: original.files.map((file) => ({ ...file, content: file.content + "// tampered\n" })),
    };

    const receipt = authorizeTrustedDeployment({
      action: "IMPORT",
      environment: "workspace",
      bundle: tampered,
    });

    expect(receipt.status).toBe("BLOCKED");
    expect(receipt.verification.decision).toBe("REJECTED");
  });

  it("detects receipt tampering", () => {
    const receipt = authorizeTrustedDeployment({
      action: "EXECUTE",
      environment: "agent",
      bundle: bundle(),
    });

    expect(verifyTrustedDeploymentReceipt({
      ...receipt,
      environment: "other",
    })).toBe(false);
  });
});
