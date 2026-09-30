import type { GoodleIRNode } from "../ir/GoodleIR";
import type { ManifestationTarget } from "./ManifestationGraph";
import { resolveTargetCapability } from "./TargetCapabilityRegistry";

export type TargetExecutionStatus =
  | "EXECUTED"
  | "BLOCKED_UNSUPPORTED"
  | "BLOCKED_CONTRACT_ONLY"
  | "BLOCKED_NO_EXECUTOR"
  | "FAILED";

export type TargetExecutionResult = {
  execution_id: string;
  target_id: string;
  source_ir: string;
  status: TargetExecutionStatus;
  adapter: string;
  version: string;
  kind: ManifestationTarget["kind"];
  capability_refs: string[];
  provenance_refs: string[];
  output?: unknown;
  error?: string;
};

export type TargetExecutorContext = {
  target: ManifestationTarget;
  source: GoodleIRNode;
};

export type TargetExecutor = (context: TargetExecutorContext) => unknown;

export type TargetExecutorRegistry = Readonly<Record<string, TargetExecutor>>;

export function targetExecutorKey(target: Pick<ManifestationTarget, "adapter" | "version">): string {
  return `${target.adapter}@${target.version}`;
}

export function executeManifestationTarget(
  target: ManifestationTarget,
  source: GoodleIRNode,
  executors: TargetExecutorRegistry,
): TargetExecutionResult {
  const resolution = resolveTargetCapability({
    kind: target.kind,
    adapter: target.adapter,
    version: target.version,
  });

  const base = {
    execution_id: `exec-${target.target_id}`,
    target_id: target.target_id,
    source_ir: source.id,
    adapter: target.adapter,
    version: target.version,
    kind: target.kind,
    capability_refs: [...resolution.capabilities],
    provenance_refs: [...target.provenance_refs, source.id],
  };

  if (target.source_ir !== source.id) {
    return {
      ...base,
      status: "FAILED",
      error: `SOURCE_IR_MISMATCH: ${target.source_ir} != ${source.id}`,
    };
  }

  if (resolution.status !== "SUPPORTED") {
    return {
      ...base,
      status: "BLOCKED_UNSUPPORTED",
      error: resolution.reason,
    };
  }

  if (resolution.evidence !== "RUNTIME") {
    return {
      ...base,
      status: "BLOCKED_CONTRACT_ONLY",
      error: "TARGET_HAS_CONTRACT_EVIDENCE_ONLY",
    };
  }

  const executor = executors[targetExecutorKey(target)];
  if (!executor) {
    return {
      ...base,
      status: "BLOCKED_NO_EXECUTOR",
      error: "NO_EXECUTOR_REGISTERED",
    };
  }

  try {
    return {
      ...base,
      status: "EXECUTED",
      output: executor({ target, source }),
    };
  } catch (error) {
    return {
      ...base,
      status: "FAILED",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
