import type { Attachment } from "@/types";

/** PUT the file to a presigned URL with real upload progress (fetch can't report it). */
function putWithProgress(url: string, file: File, onProgress?: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Storage refused the file (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Couldn't reach file storage"));
    xhr.send(file);
  });
}

/**
 * Upload one chat file straight from the browser to Cloudflare R2. Going through our own API route would cap files at
 * ~4.5 MB on Vercel — too small for phone photos, videos, PDFs and spreadsheets — so the route only hands out a signed link.
 */
export async function uploadChatFile(file: File, scope: string, onProgress?: (percent: number) => void): Promise<Attachment> {
  const res = await fetch("/api/chat/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope, name: file.name, size: file.size }),
  });
  const link = (await res.json().catch(() => ({}))) as { uploadUrl?: string; publicUrl?: string; error?: string };
  if (!res.ok || !link.uploadUrl || !link.publicUrl) throw new Error(link.error ?? "Couldn't start the upload");

  await putWithProgress(link.uploadUrl, file, onProgress);
  return { url: link.publicUrl, name: file.name, type: file.type || "application/octet-stream", size: file.size };
}
