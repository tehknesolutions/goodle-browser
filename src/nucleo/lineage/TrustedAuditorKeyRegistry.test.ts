import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createTrustedAuditorKey } from "./SignedExternalTrustAnchor";
import {
  createTrustedAuditorKeyRegistry,
  currentAuditorKeyState,
  deriveAuditorKeyStateAtSequence,
  keyWasTrustedAtSequence,
  registerTrustedAuditorKey,
  revokeTrustedAuditorKey,
  rotateTrustedAuditorKey,
  verifyTrustedAuditorKeyRegistry,
} from "./TrustedAuditorKeyRegistry";

function key(keyId: string, auditor = "auditor-59") {
  const pair = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  return createTrustedAuditorKey({
    key_id: keyId,
    auditor_id: auditor,
    public_key_pem: pair.publicKey,
  });
}

describe("M59 Trusted Auditor Key Registry", () => {
  it("registers and resolves an active auditor key", () => {
    const first = key("key-59a");
    const registry = registerTrustedAuditorKey({
      registry: createTrustedAuditorKeyRegistry(),
      key: first,
    });

    expect(currentAuditorKeyState(registry, "auditor-59")).toMatchObject({
      key_id: "key-59a",
      status: "ACTIVE",
    });
    expect(verifyTrustedAuditorKeyRegistry(registry)).toBe(true);
  });

  it("rotates keys without erasing historical trust", () => {
    const first = key("key-59a");
    const second = key("key-59b");

    let registry = registerTrustedAuditorKey({
      registry: createTrustedAuditorKeyRegistry(),
      key: first,
    });

    const beforeRotationSequence = registry.entries.length;

    registry = rotateTrustedAuditorKey({
      registry,
      current_key: first,
      next_key: second,
      reason_code: "SCHEDULED_ROTATION",
    });

    expect(
      deriveAuditorKeyStateAtSequence(
        registry,
        first.key_id,
        registry.entries.length,
      ),
    ).toMatchObject({
      key_id: "key-59a",
      status: "ROTATED",
      successor_key_id: "key-59b",
    });

    expect(currentAuditorKeyState(registry, "auditor-59")).toMatchObject({
      key_id: "key-59b",
      status: "ACTIVE",
    });

    expect(
      keyWasTrustedAtSequence({
        registry,
        key: first,
        sequence: beforeRotationSequence,
      }),
    ).toBe(true);

    expect(
      keyWasTrustedAtSequence({
        registry,
        key: first,
        sequence: registry.entries.length,
      }),
    ).toBe(false);
  });

  it("revokes a key prospectively while preserving prior trusted state", () => {
    const first = key("key-59a");

    let registry = registerTrustedAuditorKey({
      registry: createTrustedAuditorKeyRegistry(),
      key: first,
    });

    const trustedSequence = registry.entries.length;

    registry = revokeTrustedAuditorKey({
      registry,
      key: first,
      reason_code: "KEY_COMPROMISED",
    });

    expect(
      deriveAuditorKeyStateAtSequence(
        registry,
        first.key_id,
        registry.entries.length,
      )?.status,
    ).toBe("REVOKED");

    expect(
      keyWasTrustedAtSequence({
        registry,
        key: first,
        sequence: trustedSequence,
      }),
    ).toBe(true);

    expect(
      keyWasTrustedAtSequence({
        registry,
        key: first,
        sequence: registry.entries.length,
      }),
    ).toBe(false);
  });

  it("prevents a second active key without explicit rotation", () => {
    const first = key("key-59a");
    const second = key("key-59b");

    const registry = registerTrustedAuditorKey({
      registry: createTrustedAuditorKeyRegistry(),
      key: first,
    });

    expect(() =>
      registerTrustedAuditorKey({
        registry,
        key: second,
      }),
    ).toThrow("AUDITOR_ACTIVE_KEY_ALREADY_EXISTS");
  });

  it("detects historical registry tampering", () => {
    const first = key("key-59a");
    const registry = registerTrustedAuditorKey({
      registry: createTrustedAuditorKeyRegistry(),
      key: first,
    });

    const tampered = {
      ...registry,
      entries: registry.entries.map((entry) => ({
        ...entry,
        key_fingerprint_sha256: "tampered",
      })),
    };

    expect(verifyTrustedAuditorKeyRegistry(tampered)).toBe(false);
  });
});
