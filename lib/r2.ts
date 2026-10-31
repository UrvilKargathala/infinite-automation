import { createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Cloudflare R2 (S3-compatible) presigned uploads, signed with AWS SigV4 by hand so we need no SDK package.
 * The route signs a short-lived PUT link and the browser uploads straight to R2, so file size is never limited by
 * our own Vercel function (~4.5 MB cap). Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
 * R2_PUBLIC_URL (the bucket's public r2.dev or custom-domain URL, no trailing slash).
 */

const REGION = "auto";
const SERVICE = "s3";
const EXPIRES_SECONDS = 900;

function config() {
  const { R2_ACCOUNT_ID: account, R2_ACCESS_KEY_ID: keyId, R2_SECRET_ACCESS_KEY: secret, R2_BUCKET: bucket, R2_PUBLIC_URL: publicUrl } = process.env;
  if (!account || !keyId || !secret || !bucket || !publicUrl) throw new Error("File storage isn't configured (missing R2 settings)");
  return { account, keyId, secret, bucket, publicUrl: publicUrl.replace(/\/+$/, "") };
}

const sha256 = (data: string) => createHash("sha256").update(data).digest("hex");
const hmac = (key: Buffer | string, data: string) => createHmac("sha256", key).update(data).digest();

/** Object key for an upload: folder, a random prefix so names never collide, then a URL-safe version of the file name. */
export function chatObjectKey(scope: string, fileName: string): string {
  const safe = fileName.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "").slice(-120) || "file";
  return `chat/${scope}/${randomBytes(6).toString("hex")}-${safe}`;
}

/** A presigned PUT link for `key` (valid 15 minutes) plus the public URL the file will have once uploaded. */
export function presignPut(key: string): { uploadUrl: string; publicUrl: string } {
  const { account, keyId, secret, bucket, publicUrl } = config();
  const host = `${account}.r2.cloudflarestorage.com`;
  const path = `/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // 20261031T101500Z
  const day = amzDate.slice(0, 8);
  const scope = `${day}/${REGION}/${SERVICE}/aws4_request`;

  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${keyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(EXPIRES_SECONDS),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.keys(query).sort().map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`).join("&");
  const canonicalRequest = ["PUT", path, canonicalQuery, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");

  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secret}`, day), REGION), SERVICE), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  return {
    uploadUrl: `https://${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`,
    publicUrl: `${publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`,
  };
}
