"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PIPELINE_STAGES } from "./KanbanBoard";
import type { ProjectStage } from "@/types";

const supportTeam = ["Urvil Kargathala", "Henil Patel", "Tirth", "Chirag"];

export interface NewProjectData {
  customerName: string;
  siteAddress: string;
  assigned: string;
  architect: string;
  stage: ProjectStage;
}

interface Props {
  open: boolean;
  onClose: () => void;
  defaultStage?: ProjectStage;
  onSave: (data: NewProjectData) => void;
}

export function ProjectModal({ open, onClose, defaultStage, onSave }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [assigned, setAssigned] = useState(supportTeam[0]);
  const [architect, setArchitect] = useState("");
  const [stage, setStage] = useState<ProjectStage>("Inquiry");

  useEffect(() => {
    if (!open) return;
    setCustomerName("");
    setSiteAddress("");
    setAssigned(supportTeam[0]);
    setArchitect("");
    setStage(defaultStage ?? "Inquiry");
  }, [open, defaultStage]);

  function handleSave() {
    onSave({
      customerName: customerName.trim(),
      siteAddress: siteAddress.trim(),
      assigned,
      architect: architect.trim(),
      stage,
    });
    onClose();
  }

  const inputClass =
    "w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors";
  const labelClass = "block text-sm text-text-primary mb-1";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New project"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!customerName.trim()}>Save</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Customer name</label>
          <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Site address</label>
          <input className={inputClass} value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Assigned to</label>
          <select className={inputClass} value={assigned} onChange={(e) => setAssigned(e.target.value)}>
            {supportTeam.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Architect (optional)</label>
          <input className={inputClass} value={architect} onChange={(e) => setArchitect(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Initial stage</label>
          <select className={inputClass} value={stage} onChange={(e) => setStage(e.target.value as ProjectStage)}>
            {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}
