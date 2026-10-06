import {
  reflectHakodanPortalState,
  type HakodanPortalSnapshot,
} from "../runtime/HakodanPortalReflection";

export function createHakodanPortalVisualProof(portal: HakodanPortalSnapshot) {
  const reflected = reflectHakodanPortalState(portal);
  return {
    id: reflected.id,
    canonicalState: reflected.canonicalState,
    visualState: reflected.visualState,
    rendered: true as const,
    manifestation:
      reflected.visualState === "open"
        ? ("portal-open" as const)
        : ("portal-closed" as const),
  };
}
