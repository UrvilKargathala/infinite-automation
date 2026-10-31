import { Loader2, X } from "lucide-react";
import { KIND_META, attachmentKind, formatBytes } from "@/lib/utils/attachments";
import type { UploadingFile } from "@/lib/hooks/useChatAttachments";
import type { Attachment } from "@/types";

/** The composer's row of files waiting to be sent: a thumbnail (photos) or type icon, the name, and a remove button. */
export function PendingAttachments({ pending, uploading, onRemove }: {
  pending: Attachment[];
  uploading: UploadingFile[];
  onRemove: (index: number) => void;
}) {
  if (pending.length === 0 && uploading.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {pending.map((f, i) => {
        const kind = attachmentKind(f);
        const meta = KIND_META[kind];
        return (
          <div key={f.url} className="flex items-center gap-2 max-w-[220px] bg-[#F9FAFB] border border-border rounded-xl pl-1.5 pr-1 py-1">
            {kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.tone}`}><meta.icon size={16} strokeWidth={1.75} /></span>
            )}
            <span className="min-w-0">
              <span className="block text-xs text-text-primary truncate">{f.name}</span>
              {f.size != null && <span className="block text-[10px] text-text-muted">{formatBytes(f.size)}</span>}
            </span>
            <button onClick={() => onRemove(i)} aria-label={`Remove ${f.name}`} className="w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:text-danger hover:bg-white shrink-0">
              <X size={13} />
            </button>
          </div>
        );
      })}
      {uploading.map((f) => (
        <div key={f.id} className="flex items-center gap-2 max-w-[220px] bg-[#F9FAFB] border border-dashed border-border rounded-xl px-2 py-1.5">
          <Loader2 size={15} className="animate-spin text-brand-blue shrink-0" />
          <span className="min-w-0">
            <span className="block text-xs text-text-secondary truncate">{f.name}</span>
            <span className="block text-[10px] text-text-muted font-numeric">{f.progress}%</span>
          </span>
        </div>
      ))}
    </div>
  );
}
