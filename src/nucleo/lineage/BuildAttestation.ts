import type { BuildCertificationV1 } from "../manifestacao/BuildCertification";
import type { BuildReportV1 } from "../manifestacao/BuildReport";
import type { BuildLedgerRecordV1 } from "./BuildLedger";
import { sha256Json, verifyBuildLedgerRecord } from "./BuildLedger";
import type { ReproducibleBuildIdentityV1 } from "./ReproducibleBuildIdentity";

export type BuildAttestationV1 = {
  schema: "goodle.build-attestation.v1";
  attestation_id: string;
  build_id: string;
  logical_build_id: string;
  graph_id: string;
  target: BuildReportV1["target"];
  certification_status: BuildCertificationV1["status"];
  trust: {
    report_hash: string;
    certification_hash: string;
    ledger_hash: string;
    identity_hash: string;
  };
  provenance_refs: string[];
  artifact_entries: string[];
  envelope_hash: string;
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function createBuildAttestation(input: {
  report: BuildReportV1;
  certification: BuildCertificationV1;
  ledger: BuildLedgerRecordV1;
  identity: ReproducibleBuildIdentityV1;
}): BuildAttestationV1 {
  const { report, certification, ledger, identity } = input;

  if (report.build_id !== certification.build_id) {
    throw new Error("ATTESTATION_BUILD_ID_MISMATCH");
  }
  if (ledger.build_id !== report.build_id) {
    throw new Error("ATTESTATION_LEDGER_BUILD_ID_MISMATCH");
  }
  if (!verifyBuildLedgerRecord(ledger)) {
    throw new Error("ATTESTATION_LEDGER_INTEGRITY_FAILED");
  }

  const expectedReportHash = sha256Json(report);
  const expectedCertificationHash = sha256Json(certification);

  if (ledger.report_hash !== expectedReportHash) {
    throw new Error("ATTESTATION_REPORT_HASH_MISMATCH");
  }
  if (ledger.certification_hash !== expectedCertificationHash) {
    throw new Error("ATTESTATION_CERTIFICATION_HASH_MISMATCH");
  }
  if (identity.certification_hash !== expectedCertificationHash) {
    throw new Error("ATTESTATION_IDENTITY_CERTIFICATION_MISMATCH");
  }

  const provenance_refs = uniqueSorted(
    report.artifacts.flatMap((artifact) => artifact.provenance_refs),
  );
  const artifact_entries = uniqueSorted(
    report.artifacts.map((artifact) => artifact.entry),
  );

  const unsigned = {
    schema: "goodle.build-attestation.v1" as const,
    build_id: report.build_id,
    logical_build_id: identity.logical_build_id,
    graph_id: report.graph_id,
    target: report.target,
    certification_status: certification.status,
    trust: {
      report_hash: expectedReportHash,
      certification_hash: expectedCertificationHash,
      ledger_hash: ledger.record_hash,
      identity_hash: identity.composite_hash,
    },
    provenance_refs,
    artifact_entries,
  };

  const envelope_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    attestation_id: `attest-${identity.logical_build_id}-${envelope_hash.slice(0, 12)}`,
    envelope_hash,
  };
}

export function verifyBuildAttestation(attestation: BuildAttestationV1): boolean {
  const {
    attestation_id: _attestationId,
    envelope_hash,
    ...unsigned
  } = attestation;

  return sha256Json(unsigned) === envelope_hash;
}
