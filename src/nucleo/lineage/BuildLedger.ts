import { createHash } from "node:crypto";
import type { BuildCertificationV1 } from "../manifestacao/BuildCertification";
import type { BuildReportV1 } from "../manifestacao/BuildReport";

export type BuildLedgerRecordV1 = {
  schema: "goodle.build-ledger-record.v1";
  record_id: string;
  build_id: string;
  graph_id: string;
  target: BuildReportV1["target"];
  report_status: BuildReportV1["status"];
  certification_status: BuildCertificationV1["status"];
  report_hash: string;
  certification_hash: string;
  previous_record_hash?: string;
  record_hash: string;
  artifacts: Array<{
    source_ir: string;
    entry: string;
    files: string[];
    provenance_refs: string[];
  }>;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`);

  return `{${entries.join(",")}}`;
}

export function sha256Json(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function createBuildLedgerRecord(input: {
  report: BuildReportV1;
  certification: BuildCertificationV1;
  previous_record_hash?: string;
}): BuildLedgerRecordV1 {
  if (input.report.build_id !== input.certification.build_id) {
    throw new Error(
      `LEDGER_BUILD_ID_MISMATCH: ${input.report.build_id} != ${input.certification.build_id}`,
    );
  }

  const report_hash = sha256Json(input.report);
  const certification_hash = sha256Json(input.certification);

  const unsigned = {
    schema: "goodle.build-ledger-record.v1" as const,
    build_id: input.report.build_id,
    graph_id: input.report.graph_id,
    target: input.report.target,
    report_status: input.report.status,
    certification_status: input.certification.status,
    report_hash,
    certification_hash,
    previous_record_hash: input.previous_record_hash,
    artifacts: input.report.artifacts.map((artifact) => ({
      source_ir: artifact.source_ir,
      entry: artifact.entry,
      files: [...artifact.files],
      provenance_refs: [...artifact.provenance_refs],
    })),
  };

  const record_hash = sha256Json(unsigned);

  return {
    ...unsigned,
    record_id: `ledger-${input.report.build_id}-${record_hash.slice(0, 12)}`,
    record_hash,
  };
}

export function verifyBuildLedgerRecord(record: BuildLedgerRecordV1): boolean {
  const {
    record_id: _recordId,
    record_hash,
    ...unsigned
  } = record;

  return sha256Json(unsigned) === record_hash;
}

export function compareBuildLedgerRecords(
  previous: BuildLedgerRecordV1,
  current: BuildLedgerRecordV1,
) {
  return {
    graph_changed: previous.graph_id !== current.graph_id,
    target_changed: stableStringify(previous.target) !== stableStringify(current.target),
    certification_changed:
      previous.certification_status !== current.certification_status,
    artifacts_changed:
      sha256Json(previous.artifacts) !== sha256Json(current.artifacts),
    chained: current.previous_record_hash === previous.record_hash,
  };
}
