import crypto from "crypto";
import config from "../config/environment";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = config.encryptionKey || "your-secret-key-32-characters!!";

if (SECRET_KEY.length !== 32) {
  throw new Error("Encryption key must be exactly 32 characters long");
}

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, SECRET_KEY);
    cipher.setAAD(Buffer.from("GenStack", "utf8"));

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    const result: EncryptedData = {
      encryptedData: encrypted,
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
    };

    return JSON.stringify(result);
  } catch (error) {
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  try {
    const { encryptedData, iv, authTag }: EncryptedData =
      JSON.parse(encryptedText);

    const decipher = crypto.createDecipher(ALGORITHM, SECRET_KEY);
    decipher.setAAD(Buffer.from("GenStack", "utf8"));
    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Decryption failed");
  }
}

/**
 * Hash a password with salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against its hash
 */
export function verifyPassword(
  password: string,
  hashedPassword: string
): boolean {
  const [salt, hash] = hashedPassword.split(":");
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return hash === verifyHash;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Create a hash of data for integrity checking
 */
export function createHash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Verify data integrity against hash
 */
export function verifyHash(data: string, hash: string): boolean {
  return createHash(data) === hash;
}
