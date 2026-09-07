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

export async function signSession(userId: number): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(userId)));
  return `${userId}.${toHex(sig)}`;
}

/** Returns the user id encoded in the token, or null if missing/tampered. */
export async function verifySession(token: string): Promise<number | null> {
  const [idPart, sigPart] = token.split(".");
  if (!idPart || !sigPart) return null;
  const expected = await signSession(Number(idPart));
  return expected === token ? Number(idPart) : null;
}
