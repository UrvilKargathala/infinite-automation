"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Role, User } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  assignableRoles: Role[];
  onSave: (data: Omit<User, "id">) => void;
}

export function UserModal({ open, onClose, user, assignableRoles, onSave }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Staff");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  useEffect(() => {
    if (open) {
      if (user) {
        setFullName(user.fullName);
        setEmail(user.email);
        setRole(user.role);
        setStatus(user.status);
      } else {
        setFullName("");
        setEmail("");
        setRole(assignableRoles[assignableRoles.length - 1] ?? "Staff");
        setStatus("Active");
      }
    }
  }, [open, user, assignableRoles]);

  const canSave = fullName.trim() && email.trim();

  function handleSave() {
    onSave({ fullName: fullName.trim(), email: email.trim(), role, status });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? "Edit user" : "Add user"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {assignableRoles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </Select>
      </div>
    </Modal>
  );
}
