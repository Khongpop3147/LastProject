import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ENCRYPTION_ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function getVaultKey() {
  const secret = process.env.PAYMENT_CARD_SECRET || "dev-payment-card-secret";
  return createHash("sha256").update(secret).digest();
}

export function encryptCardNumber(cardNumber: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ENCRYPTION_ALGO, getVaultKey(), iv);
  const encrypted = Buffer.concat([cipher.update(cardNumber, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptCardNumber(payload: string) {
  try {
    const [ivPart, tagPart, encryptedPart] = payload.split(".");
    if (!ivPart || !tagPart || !encryptedPart) return null;

    const iv = Buffer.from(ivPart, "base64");
    const authTag = Buffer.from(tagPart, "base64");
    const encrypted = Buffer.from(encryptedPart, "base64");

    const decipher = createDecipheriv(ENCRYPTION_ALGO, getVaultKey(), iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");

    return decrypted;
  } catch {
    return null;
  }
}
