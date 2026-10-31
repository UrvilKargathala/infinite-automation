import { Download } from "lucide-react";
import { KIND_META, attachmentKind, formatBytes } from "@/lib/utils/attachments";
import type { Attachment } from "@/types";

/** Photos show up to this many tiles; the last one says "+N" when there are more. */
const MAX_TILES = 4;

/**
 * A chat message's attachments: photos as a tappable grid (opens the lightbox), videos and audio playing right in
 * the chat, and everything else (PDF, Excel, Word, zip…) as a file card with its type and size.
 */
export function AttachmentList({ attachments, onPreviewImage }: {
  attachments: Attachment[];
  onPreviewImage: (images: Attachment[], index: number) => void;
}) {
  const items = attachments.map((a) => ({ a, kind: attachmentKind(a) }));
  const images = items.filter((i) => i.kind === "image").map((i) => i.a);
  const rest = items.filter((i) => i.kind !== "image");
  if (items.length === 0) return null;

  return (
    <div className="mt-2 space-y-2 max-w-[300px]">
      {images.length > 0 && (
        <div className={`grid gap-1.5 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {images.slice(0, MAX_TILES).map((img, i) => {
            const hidden = i === MAX_TILES - 1 ? images.length - MAX_TILES : 0;
            return (
              <button
                key={img.url}
                onClick={() => onPreviewImage(images, i)}
                aria-label={`View ${img.name}`}
                className="relative rounded-xl overflow-hidden border border-white/70 bg-white/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.name} loading="lazy" className={`w-full object-cover ${images.length === 1 ? "max-h-64" : "h-24"}`} />
                {hidden > 0 && <span className="absolute inset-0 flex items-center justify-center bg-slate-900/55 text-white text-lg font-numeric">+{hidden + 1}</span>}
              </button>
            );
          })}
        </div>
      )}

      {rest.map(({ a, kind }) => {
        const meta = KIND_META[kind];
        if (kind === "video") {
          return (
            <div key={a.url} className="rounded-xl overflow-hidden border border-white/70 bg-white/70">
              <video src={a.url} controls preload="metadata" playsInline className="w-full max-h-60 bg-slate-900" />
              <a href={a.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs text-text-secondary hover:text-brand-blue">
                <span className="truncate">{a.name}</span>
                {a.size != null && <span className="shrink-0 text-text-muted">{formatBytes(a.size)}</span>}
              </a>
            </div>
          );
        }
        if (kind === "audio") {
          return (
            <div key={a.url} className="rounded-xl border border-white/70 bg-white/70 p-2">
              <audio src={a.url} controls preload="metadata" className="w-full h-9" />
              <div className="px-1 pt-1 text-xs text-text-secondary truncate">{a.name}</div>
            </div>
          );
        }
        return (
          <a
            key={a.url}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            title={`Open ${a.name}`}
            className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/80 px-3 py-2 hover:border-brand-blue/40 transition-colors"
          >
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.tone}`}><meta.icon size={18} strokeWidth={1.75} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-text-primary truncate">{a.name}</span>
              <span className="block text-[11px] text-text-muted">{meta.label}{a.size != null && ` · ${formatBytes(a.size)}`}</span>
            </span>
            <Download size={15} className="text-text-muted shrink-0" />
          </a>
        );
      })}
    </div>
  );
}
