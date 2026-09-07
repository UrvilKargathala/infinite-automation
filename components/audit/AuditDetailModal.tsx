"use client";

import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/users/RoleBadge";
import { Button } from "@/components/ui/Button";
import { moduleColors, actionMeta, formatFullTimestamp } from "./auditMeta";
import type { AuditLog } from "@/types";

function fieldLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function AuditDetailModal({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  if (!log) return null;
  const action = actionMeta[log.action];
  const moduleColor = moduleColors[log.module];
  const before = log.changes?.before ?? null;
  const after = log.changes?.after ?? null;
  const keys = new Set([...(before ? Object.keys(before) : []), ...(after ? Object.keys(after) : [])]);

  return (
    <Modal open={!!log} onClose={onClose} title="Activity detail" footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      <div className="space-y-6">
        {/* Meta block */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Avatar name={log.userName} size="sm" />
            <div>
              <div className="text-sm text-text-primary">{log.userName}</div>
              <RoleBadge role={log.userRole} />
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: moduleColor + "18", color: moduleColor }}>
            {log.module}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: action.color + "18", color: action.color }}>
            <action.icon size={12} /> {action.label}
          </span>
          <span className="text-xs text-text-muted ml-auto">{formatFullTimestamp(log.timestamp)}</span>
        </div>

        {/* Summary */}
        <div className="text-base text-text-primary">{log.summary}</div>

        {/* Changes */}
        {log.changes && keys.size > 0 && (
          <div>
            <div className="text-sm text-text-muted mb-2">What changed</div>
            <div className="space-y-3">
              {[...keys].map((key) => (
                <div key={key}>
                  <div className="text-xs uppercase tracking-wider text-text-muted mb-1">{fieldLabel(key)}</div>
                  <div className={`grid gap-2 ${before && after ? "grid-cols-2" : "grid-cols-1"}`}>
                    {before && (
                      <div className="bg-danger/10 rounded-lg px-3 py-2 text-sm text-text-primary">
                        {renderValue(before[key])}
                      </div>
                    )}
                    {after && (
                      <div className="bg-success/10 rounded-lg px-3 py-2 text-sm text-text-primary">
                        {renderValue(after[key])}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div>
            <div className="text-sm text-text-muted mb-2">Additional context</div>
            <div className="space-y-2 text-xs">
              {Object.entries(log.metadata).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-text-muted shrink-0 w-32">{fieldLabel(key)}</span>
                  {typeof value === "object" && value !== null ? (
                    <pre className="font-mono bg-surface-alt rounded-lg p-2 text-[11px] overflow-x-auto flex-1 whitespace-pre-wrap">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-text-primary">{renderValue(value)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
