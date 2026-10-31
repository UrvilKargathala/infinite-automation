import { File as FileIcon, FileArchive, FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo, Presentation, type LucideIcon } from "lucide-react";
import type { Attachment } from "@/types";

export type AttachmentKind = "image" | "video" | "audio" | "pdf" | "sheet" | "doc" | "slides" | "archive" | "text" | "file";

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const EXT: Record<string, AttachmentKind> = {
  jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image", avif: "image", bmp: "image", svg: "image",
  mp4: "video", mov: "video", webm: "video", m4v: "video", ogv: "video",
  mp3: "audio", wav: "audio", m4a: "audio", ogg: "audio", aac: "audio",
  pdf: "pdf",
  xls: "sheet", xlsx: "sheet", xlsm: "sheet", csv: "sheet", ods: "sheet",
  doc: "doc", docx: "doc", odt: "doc", rtf: "doc",
  ppt: "slides", pptx: "slides", key: "slides", odp: "slides",
  zip: "archive", rar: "archive", "7z": "archive", gz: "archive", tar: "archive",
  txt: "text", md: "text", json: "text", log: "text",
};

export const fileExt = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");

/** What a file is, from its MIME type or — when the browser sent none (it often does for spreadsheets) — its extension. */
export function attachmentKind(a: Pick<Attachment, "name" | "type">): AttachmentKind {
  const t = a.type.toLowerCase();
  const ext = fileExt(a.name);
  // iPhone photos (HEIC/HEIF) are images to the phone but most desktop browsers can't draw them, so they stay downloadable files.
  if (ext === "heic" || ext === "heif" || t === "image/heic" || t === "image/heif") return "file";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (t === "application/pdf") return "pdf";
  if (t.includes("spreadsheet") || t.includes("ms-excel") || t === "text/csv") return "sheet";
  if (t.includes("wordprocessing") || t === "application/msword") return "doc";
  if (t.includes("presentation") || t.includes("powerpoint")) return "slides";
  if (t.includes("zip") || t.includes("compressed") || t.includes("tar")) return "archive";
  return EXT[ext] ?? (t.startsWith("text/") ? "text" : "file");
}

export const KIND_META: Record<AttachmentKind, { label: string; icon: LucideIcon; tone: string }> = {
  image: { label: "Image", icon: FileImage, tone: "bg-brand-blue/10 text-brand-blue" },
  video: { label: "Video", icon: FileVideo, tone: "bg-purple/10 text-purple" },
  audio: { label: "Audio", icon: FileAudio, tone: "bg-purple/10 text-purple" },
  pdf: { label: "PDF", icon: FileText, tone: "bg-danger/10 text-danger" },
  sheet: { label: "Spreadsheet", icon: FileSpreadsheet, tone: "bg-success/10 text-success" },
  doc: { label: "Document", icon: FileText, tone: "bg-info/10 text-info" },
  slides: { label: "Presentation", icon: Presentation, tone: "bg-warning/10 text-warning" },
  archive: { label: "Archive", icon: FileArchive, tone: "bg-text-primary/10 text-text-secondary" },
  text: { label: "Text", icon: FileText, tone: "bg-text-primary/10 text-text-secondary" },
  file: { label: "File", icon: FileIcon, tone: "bg-text-primary/10 text-text-secondary" },
};

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
