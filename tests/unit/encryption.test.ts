import { describe, expect, it } from "vitest";

import {
  decrypt,
  encrypt,
  hashPayload,
  redactSnapshot,
} from "@/lib/encryption";

describe("encrypt / decrypt", () => {
  it("roundtrips a string without loss", () => {
    const plaintext = "fansly-cookie-and-secret";
    const payload = encrypt(plaintext);
    const recovered = decrypt(payload);
    expect(recovered).toBe(plaintext);
  });

  it("produces a unique IV per encryption (so identical plaintexts diverge)", () => {
    const a = encrypt("same-input");
    const b = encrypt("same-input");
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    // Auth tag also diverges with a fresh IV.
    expect(a.authTag).not.toBe(b.authTag);
  });

  it("tags the version + key id so rotation is observable from storage", () => {
    const payload = encrypt("payload");
    expect(payload.encryptionVersion).toBe("v1_aes_256_gcm");
    expect(payload.encryptionKeyId).toBeTruthy();
  });
});

describe("hashPayload", () => {
  it("is deterministic for the same input", () => {
    const a = hashPayload({ id: 1, name: "abc" });
    const b = hashPayload({ id: 1, name: "abc" });
    expect(a).toBe(b);
  });

  it("differs when payload bytes differ", () => {
    const a = hashPayload({ id: 1 });
    const b = hashPayload({ id: 2 });
    expect(a).not.toBe(b);
  });
});

describe("redactSnapshot", () => {
  it("replaces sensitive keys with [REDACTED]", () => {
    const out = redactSnapshot({
      id: 1,
      token: "secret-bearer",
      nested: { api_key: "xyz", safe: "ok" },
    }) as Record<string, unknown>;
    expect(out.token).toBe("[REDACTED]");
    const nested = out.nested as Record<string, unknown>;
    expect(nested.api_key).toBe("[REDACTED]");
    expect(nested.safe).toBe("ok");
  });

  it("caps recursion depth to prevent runaway snapshots", () => {
    // Deep object: { a: { a: { a: ... } } } — redactor should bottom out.
    const root: { a: unknown } = { a: null };
    let cursor = root;
    for (let i = 0; i < 10; i++) {
      const next: { a: unknown } = { a: null };
      cursor.a = next;
      cursor = next;
    }
    const out = redactSnapshot(root) as Record<string, unknown>;
    // Walking far enough should hit the [max_depth] sentinel.
    let pointer: unknown = out;
    for (let i = 0; i < 8 && pointer && typeof pointer === "object"; i++) {
      pointer = (pointer as Record<string, unknown>).a;
    }
    expect(pointer === "[max_depth]" || pointer === null || pointer === undefined).toBe(true);
  });
});
