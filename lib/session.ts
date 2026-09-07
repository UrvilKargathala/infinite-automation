import type { Role } from "@/types";

export const SESSION_COOKIE = "ia_session";

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(userId: number, role: Role): Promise<string> {
  const key = await getKey();
  const payload = `${userId}.${role}`;
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(sig)}`;
}

/** Returns the user id + role encoded in the token, or null if missing/tampered. */
export async function verifySession(token: string): Promise<{ userId: number; role: Role } | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [idPart, rolePart] = parts;
  const expected = await signSession(Number(idPart), rolePart as Role);
  return expected === token ? { userId: Number(idPart), role: rolePart as Role } : null;
}
