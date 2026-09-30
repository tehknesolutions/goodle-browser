import { describe, expect, it } from "vitest";
import { sha256Json } from "./BuildLedger";
import type { RuntimeEvidencePackageV1 } from "./RuntimeEvidencePackage";
import type { EvidencePackageConsumerResultV1 } from "./EvidencePackageConsumer";
import {
  appendPublicationReceipt,
  createPublicationReceipt,
  createPublicationRegistry,
  verifyPublicationReceipt,
  verifyPublicationRegistry,
} from "./PublicationRegistry";

function pkg(): RuntimeEvidencePackageV1 {
  return {
    schema: "goodle.runtime-evidence-package.v1",
    package_id: "runtime-evidence-47",
    build_id: "build-47",
    logical_build_id: "logical-47",
    bundle_id: "bundle-47",
    execution_id: "exec-47",
    closed_loop_proof: {} as RuntimeEvidencePackageV1["closed_loop_proof"],
    browser_runtime_proof: {} as RuntimeEvidencePackageV1["browser_runtime_proof"],
    visual_runtime_evidence: {} as RuntimeEvidencePackageV1["visual_runtime_evidence"],
    package_hash: "package-hash-47",
  };
}

function accepted(
  target: "IMPORT" | "PUBLISH" | "MARKETPLACE" | "HNK_VERSE",
): EvidencePackageConsumerResultV1 {
  return {
    schema: "goodle.evidence-package-consumer-result.v1",
    package_id: "runtime-evidence-47",
    target,
    decision: "ACCEPTED",
    admissible: true,
    reasons: [],
    verification: {
      schema: "goodle.runtime-evidence-package-verification.v1",
      valid: true,
      checks: {
        closed_loop_hash: true,
        browser_proof_hash: true,
        visual_evidence_hash: true,
        identity_links: true,
        package_hash: true,
      },
      reasons: [],
    },
  };
}

describe("M47 Publication / Marketplace Receipt", () => {
  it("records marketplace publication only after ACCEPTED admission", () => {
    const receipt = createPublicationReceipt({
      package: pkg(),
      admission: accepted("MARKETPLACE"),
      registry_ref: "marketplace://goodle/item-47",
    });

    expect(receipt).toMatchObject({
      target: "MARKETPLACE",
      action: "MARKETPLACE_LISTED",
      status: "COMPLETED",
      registry_ref: "marketplace://goodle/item-47",
    });
    expect(verifyPublicationReceipt(receipt)).toBe(true);

    const registry = appendPublicationReceipt(
      createPublicationRegistry(),
      receipt,
    );

    expect(registry.entries).toHaveLength(1);
    expect(verifyPublicationRegistry(registry)).toBe(true);
  });

  it("records HNK-VERSE admission distinctly", () => {
    const receipt = createPublicationReceipt({
      package: pkg(),
      admission: accepted("HNK_VERSE"),
      registry_ref: "hnk-verse://worlds/runtime-evidence-47",
    });

    expect(receipt.action).toBe("HNK_VERSE_ADMITTED");
  });

  it("refuses publication from a quarantined package", () => {
    const admission = {
      ...accepted("MARKETPLACE"),
      decision: "QUARANTINED" as const,
      admissible: false,
      reasons: ["SUCCESSFUL_OUTCOME_REQUIRED"],
    };

    expect(() =>
      createPublicationReceipt({
        package: pkg(),
        admission,
        registry_ref: "marketplace://goodle/item-47",
      }),
    ).toThrow("EVIDENCE_PACKAGE_NOT_ADMISSIBLE");
  });

  it("prevents the same publication action from being recorded twice", () => {
    const receipt = createPublicationReceipt({
      package: pkg(),
      admission: accepted("PUBLISH"),
      registry_ref: "publish://goodle/runtime-evidence-47",
    });

    const once = appendPublicationReceipt(
      createPublicationRegistry(),
      receipt,
    );

    expect(() =>
      appendPublicationReceipt(once, receipt),
    ).toThrow("PUBLICATION_ALREADY_RECORDED");
  });

  it("detects registry tampering", () => {
    const receipt = createPublicationReceipt({
      package: pkg(),
      admission: accepted("IMPORT"),
      registry_ref: "import://consumer/runtime-evidence-47",
    });
    const registry = appendPublicationReceipt(
      createPublicationRegistry(),
      receipt,
    );

    const tampered = {
      ...registry,
      entries: registry.entries.map((entry, index) =>
        index === 0 ? { ...entry, package_hash: "tampered" } : entry,
      ),
    };

    expect(verifyPublicationRegistry(tampered)).toBe(false);
  });
});
