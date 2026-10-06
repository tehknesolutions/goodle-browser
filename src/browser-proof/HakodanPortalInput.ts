import type { HakodanPortalSnapshot } from "../runtime/HakodanPortalReflection";

export function readHakodanPortalInput(value: unknown): HakodanPortalSnapshot {
  if (value === undefined || value === null) {
    throw new Error("GOODLE_HAKODAN_PORTAL_INPUT_MISSING");
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("GOODLE_HAKODAN_PORTAL_STATE_INVALID");
  }
  const portal = value as { id?: unknown; state?: unknown };
  if (
    typeof portal.id !== "string" ||
    portal.id.length === 0 ||
    (portal.state !== "closed" && portal.state !== "open")
  ) {
    throw new Error("GOODLE_HAKODAN_PORTAL_STATE_INVALID");
  }
  return { id: portal.id, state: portal.state };
}
