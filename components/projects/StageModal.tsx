"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { STAGES_QUERY_KEY } from "@/lib/hooks/usePipelineStages";
import { useProjectStore } from "@/lib/store/useProjectStore";
import type { PipelineStage } from "@/types";

/** Add a custom CRM stage (name + where it goes), or rename an existing custom stage. */
export function StageModal({
  open,
  onClose,
  stages,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  stages: PipelineStage[];
  /** The custom stage being renamed; omit to add a new one. */
  editing?: PipelineStage | null;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [afterId, setAfterId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    // New stages default to just before the last stage (Install), where custom steps usually go.
    setAfterId(String(stages[Math.max(0, stages.length - 2)]?.id ?? ""));
  }, [open, editing, stages]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = editing
        ? await fetch(`/api/pipeline-stages/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: trimmed }) })
        : await fetch("/api/pipeline-stages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: trimmed, afterId: Number(afterId) }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't save the stage");
      await queryClient.invalidateQueries({ queryKey: STAGES_QUERY_KEY });
      // The server moved the cards in that column to the new name — mirror it locally.
      if (editing) {
        useProjectStore.setState((st) => ({ projects: st.projects.map((p) => (p.stage === editing.name ? { ...p, stage: trimmed } : p)) }));
      }
      toast.success(editing ? `Renamed to "${trimmed}"` : `Added "${trimmed}" stage`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the stage");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Rename stage" : "Add stage"}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()}>{saving ? "Saving…" : editing ? "Rename" : "Add stage"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Stage name"
          value={name}
          maxLength={40}
          autoFocus
          placeholder="e.g. Site Survey"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        {!editing && (
          <Select label="Place after" value={afterId} onChange={(e) => setAfterId(e.target.value)}>
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        )}
        <p className="text-xs text-text-muted">
          The six default stages are fixed. Custom stages can be renamed, or deleted once they&apos;re empty.
        </p>
      </div>
    </Modal>
  );
}
