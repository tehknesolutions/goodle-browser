import type { ManifestationKind } from "./ManifestationGraph";

export type TargetSupportStatus = "SUPPORTED" | "UNSUPPORTED";
export type TargetEvidenceLevel = "RUNTIME" | "CONTRACT";

export type TargetCapabilityDefinition = {
  target_id: string;
  adapter: string;
  version: string;
  kinds: readonly ManifestationKind[];
  capabilities: readonly string[];
  status: "SUPPORTED";
  evidence: TargetEvidenceLevel;
};

export type TargetCapabilityRequest = {
  kind: ManifestationKind;
  adapter: string;
  version: string;
};

export type TargetCapabilityResolution = {
  status: TargetSupportStatus;
  target_id?: string;
  adapter: string;
  version: string;
  kind: ManifestationKind;
  capabilities: string[];
  evidence?: TargetEvidenceLevel;
  reason?: "UNKNOWN_ADAPTER" | "UNSUPPORTED_KIND" | "UNSUPPORTED_VERSION";
};

export const TARGET_CAPABILITY_INVENTORY_V1: readonly TargetCapabilityDefinition[] = [
  {
    target_id: "react-web-v19",
    adapter: "react",
    version: "19",
    kinds: ["web", "app", "ui"],
    capabilities: ["ui.components", "ui.state", "web.render"],
    status: "SUPPORTED",
    evidence: "RUNTIME",
  },
  {
    target_id: "phaser-game-v3",
    adapter: "phaser",
    version: "3",
    kinds: ["game"],
    capabilities: ["game.2d", "game.scene", "game.input", "game.camera", "game.animation"],
    status: "SUPPORTED",
    evidence: "RUNTIME",
  },
  {
    target_id: "react-phaser-hybrid-v1",
    adapter: "react-phaser",
    version: "1",
    kinds: ["app", "web", "game", "ui"],
    capabilities: ["ui.components", "game.2d", "runtime.hybrid"],
    status: "SUPPORTED",
    evidence: "CONTRACT",
  },
  {
    target_id: "hnk-verse-world-v0.1",
    adapter: "hnk-verse",
    version: "0.1",
    kinds: ["world"],
    capabilities: ["world.manifestation", "hnk.semantic.projection", "provenance.identity"],
    status: "SUPPORTED",
    evidence: "CONTRACT",
  },
] as const;

function versionMatches(supported: string, requested: string): boolean {
  if (supported === requested) return true;
  if (!supported.includes(".")) return requested === supported || requested.startsWith(supported + ".");
  return false;
}

export function resolveTargetCapability(
  request: TargetCapabilityRequest,
  inventory: readonly TargetCapabilityDefinition[] = TARGET_CAPABILITY_INVENTORY_V1,
): TargetCapabilityResolution {
  const byAdapter = inventory.filter((entry) => entry.adapter === request.adapter);
  if (byAdapter.length === 0) {
    return {
      status: "UNSUPPORTED",
      adapter: request.adapter,
      version: request.version,
      kind: request.kind,
      capabilities: [],
      reason: "UNKNOWN_ADAPTER",
    };
  }

  const byKind = byAdapter.filter((entry) => entry.kinds.includes(request.kind));
  if (byKind.length === 0) {
    return {
      status: "UNSUPPORTED",
      adapter: request.adapter,
      version: request.version,
      kind: request.kind,
      capabilities: [],
      reason: "UNSUPPORTED_KIND",
    };
  }

  const matched = byKind.find((entry) => versionMatches(entry.version, request.version));
  if (!matched) {
    return {
      status: "UNSUPPORTED",
      adapter: request.adapter,
      version: request.version,
      kind: request.kind,
      capabilities: [],
      reason: "UNSUPPORTED_VERSION",
    };
  }

  return {
    status: "SUPPORTED",
    target_id: matched.target_id,
    adapter: request.adapter,
    version: request.version,
    kind: request.kind,
    capabilities: [...matched.capabilities],
    evidence: matched.evidence,
  };
}

export function targetIsSupported(request: TargetCapabilityRequest): boolean {
  return resolveTargetCapability(request).status === "SUPPORTED";
}

export function targetHasRuntimeEvidence(request: TargetCapabilityRequest): boolean {
  const resolution = resolveTargetCapability(request);
  return resolution.status === "SUPPORTED" && resolution.evidence === "RUNTIME";
}
