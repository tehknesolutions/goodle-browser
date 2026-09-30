export type QualityGateReport = {
  schema: string;
  gate: string;
  status: string;
  git?: {
    commit_sha?: string;
    tracked_dirty?: boolean;
  };
  runtime?: {
    node?: string;
    npm?: string;
    platform?: string;
    arch?: string;
  };
  steps?: Array<{
    command?: string;
    exit_code?: number;
    signal?: string | null;
    status?: string;
  }>;
};

export type IndependentQualityAttestation = {
  schema: "goodle.independent-quality-gate-attestation.v1";
  gate: "M71";
  quality_report: {
    schema: string;
    sha256: string;
    facts_sha256: string;
  };
  git: {
    commit_sha: string;
  };
  runtime: Record<string, unknown>;
  steps: Array<Record<string, unknown>>;
  created_at: string;
  attestation_id: string;
  attestation_hash: string;
};

export function sha256Json(value: unknown): string;
export function sha256File(path: string): string;

export function validateQualityReport(
  report: QualityGateReport,
  expectedCommitSha?: string,
): {
  valid: boolean;
  reasons: string[];
};

export function createIndependentQualityAttestation(input: {
  report: QualityGateReport;
  reportSha256: string;
  expectedCommitSha?: string;
  createdAt?: string;
}): IndependentQualityAttestation;

export function verifyIndependentQualityAttestation(input: {
  attestation: IndependentQualityAttestation;
  report: QualityGateReport;
  reportSha256: string;
  expectedCommitSha?: string;
}): {
  schema: "goodle.independent-quality-gate-attestation-verification.v1";
  valid: boolean;
  reasons: string[];
  commit_sha?: string;
  attestation_id?: string;
};
