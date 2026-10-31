import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { chatObjectKey, presignPut } from "@/lib/r2";
import { MAX_UPLOAD_BYTES } from "@/lib/utils/attachments";

/**
 * Upload-link endpoint for chat attachments. The browser asks here, we check they're signed in and the request is
 * sane, and hand back a short-lived Cloudflare R2 link; the file itself then goes straight to R2 (no size limit from
 * our function). Any file type is allowed, up to MAX_UPLOAD_BYTES. The attachment is saved with the message itself,
 * so there's nothing to record here.
 */
export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { scope?: unknown; name?: unknown; size?: unknown } | null;
  const scope = typeof body?.scope === "string" ? body.scope : "";
  const name = typeof body?.name === "string" ? body.name : "";
  const size = typeof body?.size === "number" ? body.size : 0;

  if (!/^(project|ticket)-\d+$/.test(scope) || !name) return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  if (size <= 0 || size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File is empty or too big" }, { status: 400 });

  try {
    return NextResponse.json(presignPut(chatObjectKey(scope, name)));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
