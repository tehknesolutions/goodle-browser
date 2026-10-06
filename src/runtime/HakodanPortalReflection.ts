export type HakodanPortalState = "closed" | "open";

export interface HakodanPortalSnapshot {
  id: string;
  state: HakodanPortalState;
}

export interface HakodanPortalReflection {
  id: string;
  canonicalState: HakodanPortalState;
  visualState: HakodanPortalState;
  observable: true;
}

export function reflectHakodanPortalState(
  portal: HakodanPortalSnapshot,
): HakodanPortalReflection {
  if (
    !portal ||
    typeof portal !== "object" ||
    typeof portal.id !== "string" ||
    portal.id.length === 0 ||
    (portal.state !== "closed" && portal.state !== "open")
  ) {
    throw new Error("GOODLE_HAKODAN_PORTAL_STATE_INVALID");
  }

  return {
    id: portal.id,
    canonicalState: portal.state,
    visualState: portal.state,
    observable: true,
  };
}
