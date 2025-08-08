import crypto from "node:crypto";
import { env } from "@better-env/env/server";

const ALG = "aes-256-gcm";

function getMasterSecret(): string {
  // validated by @better-env/env/server
  return env.ENV_ENCRYPTION_KEY;
}

function deriveProjectKey(projectId: string): Buffer {
  const secret = getMasterSecret();
  // Use Node's scryptSync to derive a 32-byte key from master secret and projectId as salt
  return crypto.scryptSync(secret, projectId, 32, { N: 16384, r: 8, p: 1 });
}

export function encryptSecretForProject(projectId: string, plaintext: string): string {
  const key = deriveProjectKey(projectId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc1:${iv.toString("hex")}:${enc.toString("hex")}:${tag.toString("hex")}`;
}

export function decryptSecretForProject(projectId: string, ciphertext: string): string {
  const key = deriveProjectKey(projectId);
  const parts = ciphertext.split(":");
  const hasPrefix = parts[0] === "enc1";
  const [ivHex, dataHex, tagHex] = hasPrefix ? parts.slice(1) : parts;
  if (!ivHex || !dataHex || !tagHex) return ciphertext;
  const iv = Buffer.from(ivHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

export function maskSecret(value: string, visible: number = 0): string {
  if (!value) return "";
  if (visible <= 0) return "••••••";
  const head = value.slice(0, visible);
  return head + "••••";
}

