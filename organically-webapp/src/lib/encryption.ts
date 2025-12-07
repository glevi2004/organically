import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Get the encryption key from environment variables
 * Key must be 32 bytes (64 hex characters) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY environment variable is not set. " +
        "Generate one with: openssl rand -hex 32"
    );
  }

  if (key.length !== 64) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes). " +
        "Generate one with: openssl rand -hex 32"
    );
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt a string using AES-256-CBC
 * Returns format: iv:encryptedData (both hex encoded)
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return iv:encrypted so we can decrypt later
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a string that was encrypted with encrypt()
 * Expects format: iv:encryptedData (both hex encoded)
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();

  const [ivHex, encryptedHex] = encryptedText.split(":");

  if (!ivHex || !encryptedHex) {
    throw new Error("Invalid encrypted text format. Expected iv:encryptedData");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a string looks like it's encrypted (has the iv:data format)
 */
export function isEncrypted(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const parts = text.split(":");
  // Check if it has exactly 2 parts and first part is 32 hex chars (16 bytes IV)
  return parts.length === 2 && parts[0].length === 32 && /^[0-9a-f]+$/i.test(parts[0]);
}

