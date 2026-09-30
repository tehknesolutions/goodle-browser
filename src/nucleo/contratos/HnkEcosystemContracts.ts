export type AuthorityState =
  | "OBSERVED" | "DERIVED" | "HYPOTHESIS" | "CANDIDATE"
  | "VALIDATED" | "CANONICAL" | "UNRESOLVED" | "DISCOVERY_NON_CANONICAL";

export type CodexAdmissionDecision =
  | "CORE" | "REFERENCE" | "CANDIDATE" | "RESEARCH_ONLY" | "EXCLUDE_OPERATIONALLY";

export type ActorType = "human" | "agent" | "service" | "organization";

export type IdentityRef = {
  canonical_id: string;
  actor_type: ActorType;
};

export type ProjectContext = {
  project_id: string;
  workspace_id?: string;
  session_id?: string;
  resource_refs?: string[];
  constraints?: Record<string, unknown>;
};

export type IntentEnvelope = {
  intent_id: string;
  version: number;
  status: "draft" | "active" | "fulfilled" | "superseded" | "abandoned" | "cancelled";
  principal: IdentityRef;
  project_ref?: string;
  session_ref?: string;
  desired_outcome: unknown;
  purpose?: string;
  context?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  acceptance_conditions?: unknown[];
  created_at: string;
  supersedes?: string;
  related_intents?: string[];
};

export type ExecutionPlan = {
  plan_id: string;
  intent_ref: string;
  version: number;
  status: "draft" | "approved" | "rejected" | "executing" | "completed" | "failed" | "abandoned";
  constraints: Record<string, unknown>;
};

export type CapabilityRequest = {
  request_id: string;
  subject: IdentityRef;
  capability: string;
  resource_ref: string;
  intent_ref?: string;
  plan_ref?: string;
  project_ref?: string;
  session_ref?: string;
  requested_at: string;
  parameters?: Record<string, unknown>;
};

export type CapabilityGrant = {
  grant_id: string;
  subject: IdentityRef;
  capability: string;
  resource_refs: string[];
  scope: Record<string, unknown>;
  constraints: Record<string, unknown>;
  authorized_by: IdentityRef;
  project_ref?: string;
  session_ref?: string;
  valid_from: string;
  valid_until?: string;
  status: "active" | "revoked" | "expired";
  redelegable: false;
};

export type EventEnvelope = {
  event_id: string;
  event_type: string;
  occurred_at: string;
  recorded_at: string;
  actor?: IdentityRef;
  runtime_ref?: IdentityRef;
  project_ref?: string;
  session_ref?: string;
  intent_refs?: string[];
  parent_event_refs?: string[];
  causation_refs?: string[];
  correlation_refs?: string[];
  status: "observed" | "accepted" | "rejected" | "failed" | "partial";
  payload: Record<string, unknown>;
  correction_of?: string;
};

export type ProvenanceRecord = {
  source_id: string;
  source_kind: string;
  source_ref?: string;
  repository?: string;
  revision?: string;
  authority_state: AuthorityState;
  parent_refs?: string[];
  transformations?: Array<{
    operation: string;
    version: string;
    input_refs: string[];
    output_ref: string;
  }>;
};

export type EvidenceRef = {
  evidence_id: string;
  source_ref: string;
  classification: "DESCRIPTIVE" | "PROCESS_INTEGRITY" | "EXPLORATORY_INTERPRETATION";
  coverage: "COMPLETE_FOR_DECLARED_REQUIREMENTS" | "PARTIAL" | "INSUFFICIENT";
  truth_assessed: false;
  causal_claim_permitted: false;
  metaphysical_proof_permitted: false;
};

export function requireResolved<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`UNRESOLVED: ${label}`);
  return value;
}

export function capabilityMayExecute(
  request: CapabilityRequest,
  grants: readonly CapabilityGrant[],
): boolean {
  return grants.some((grant) =>
    grant.status === "active" &&
    grant.subject.canonical_id === request.subject.canonical_id &&
    grant.subject.actor_type === request.subject.actor_type &&
    grant.capability === request.capability &&
    grant.resource_refs.includes(request.resource_ref),
  );
}
