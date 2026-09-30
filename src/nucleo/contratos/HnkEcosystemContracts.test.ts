import { describe, expect, it } from "vitest";
import { capabilityMayExecute, requireResolved } from "./HnkEcosystemContracts";

describe("HNK ecosystem contracts", () => {
  it("does not grant capability without an active matching grant", () => {
    const request = {
      request_id: "req-1",
      subject: { canonical_id: "agent:builder", actor_type: "agent" as const },
      capability: "filesystem.write",
      resource_ref: "project:goodle",
      requested_at: "2026-09-29T00:00:00Z",
    };
    expect(capabilityMayExecute(request, [])).toBe(false);
    expect(capabilityMayExecute(request, [{
      grant_id: "grant-1",
      subject: request.subject,
      capability: request.capability,
      resource_refs: [request.resource_ref],
      scope: {},
      constraints: {},
      authorized_by: { canonical_id: "human:owner", actor_type: "human" },
      valid_from: "2026-09-29T00:00:00Z",
      status: "active",
      redelegable: false,
    }])).toBe(true);
  });

  it("keeps unresolved values explicit", () => {
    expect(() => requireResolved(undefined, "HNK token")).toThrow("UNRESOLVED");
  });
});
