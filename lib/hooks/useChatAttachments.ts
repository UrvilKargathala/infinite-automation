"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { uploadChatFile } from "@/lib/chatUpload";
import { MAX_UPLOAD_BYTES, formatBytes } from "@/lib/utils/attachments";
import type { Attachment } from "@/types";

export interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

/**
 * The composer's attachments: files picked, pasted or dropped upload in parallel and become `pending` once done,
 * ready to send with the message. `scope` is the storage folder (e.g. "project-12"); null until a record is open.
 */
export function useChatAttachments(scope: string | null) {
  const [pending, setPending] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);

  const addFiles = useCallback(async (files: File[]) => {
    if (!scope) return;
    await Promise.all(files.map(async (file) => {
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`${file.name} is too big — the limit is ${formatBytes(MAX_UPLOAD_BYTES)}`);
        return;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setUploading((u) => [...u, { id, name: file.name, progress: 0 }]);
      try {
        const attachment = await uploadChatFile(file, scope, (progress) => setUploading((u) => u.map((f) => (f.id === id ? { ...f, progress } : f))));
        setPending((p) => [...p, attachment]);
      } catch (err) {
        console.error("Chat upload failed", err);
        toast.error(`Couldn't upload ${file.name}${err instanceof Error && err.message ? ` — ${err.message}` : ""}`);
      } finally {
        setUploading((u) => u.filter((f) => f.id !== id));
      }
    }));
  }, [scope]);

  const remove = useCallback((index: number) => setPending((p) => p.filter((_, i) => i !== index)), []);
  const clear = useCallback(() => setPending([]), []);

  return { pending, uploading, busy: uploading.length > 0, addFiles, remove, clear };
}
