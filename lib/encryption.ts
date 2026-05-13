/**
 * Envelope Encryption – AES-256-GCM
 *
 * SERVER-ONLY. Never import from client components or edge runtimes.
 * Requires: ENCRYPTION_MASTER_KEY env var (64 hex chars = 32 bytes).
 *
 * V1: local master key from env.
 * Future V2: replace masterKey derivation with KMS decrypt call.
 */

// 'node:crypto' – explicit Node specifier ensures this is never bundled for edge/client
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_BYTES = 16; // 128-bit auth tag

export interface EncryptedPayload {
  /** AES-256-GCM ciphertext, base64 encoded. */
  ciphertext: string;
  /** 12-byte IV, base64 encoded. */
  iv: string;
  /** 16-byte GCM auth tag, base64 encoded. */
  authTag: string;
  /** Key identifier for rotation support. */
  encryptionKeyId: string;
  /** Algorithm version. Increment when algorithm changes. */
  encryptionVersion: string;
}

function getMasterKey(): Buffer {
  const hex = process.env.ENCRYPTION_MASTER_KEY;
  if (!hex) {
    throw new Error(
      '[encryption] ENCRYPTION_MASTER_KEY is not set. ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  if (hex.length !== 64) {
    throw new Error(
      '[encryption] ENCRYPTION_MASTER_KEY must be exactly 64 hex characters (32 bytes).'
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns an EncryptedPayload safe to store in Postgres.
 */
export function encrypt(plaintext: string): EncryptedPayload {
  const key = getMasterKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertextBuffer = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertextBuffer.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    encryptionKeyId: process.env.ENCRYPTION_KEY_ID ?? 'local_master_key_v1',
    encryptionVersion: 'v1_aes_256_gcm',
  };
}

/**
 * Decrypt an EncryptedPayload back to the original plaintext.
 * Never log the return value.
 */
export function decrypt(payload: EncryptedPayload): string {
  const key = getMasterKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(payload.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}

/**
 * SHA-256 hash of arbitrary content (for payload deduplication in platform_events).
 * Returns hex string.
 */
export function hashPayload(content: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(content))
    .digest('hex');
}

/**
 * Redact sensitive keys from an object before storing as a snapshot.
 * Extend redactedKeys as needed.
 */
const REDACTED_KEYS = new Set([
  'password', 'token', 'api_key', 'apiKey', 'secret', 'credential',
  'credentials', 'auth', 'authorization', 'content', 'message',
]);

export function redactSnapshot(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[max_depth]';
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => redactSnapshot(item, depth + 1));

  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([key, value]) => {
      if (REDACTED_KEYS.has(key)) return [key, '[REDACTED]'];
      return [key, redactSnapshot(value, depth + 1)];
    })
  );
}
