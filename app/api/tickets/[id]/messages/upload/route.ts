import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentAppUser } from "@/lib/currentAppUser";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const blob = await put(`ticket-${params.id}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url, name: file.name, type: file.type });
}
