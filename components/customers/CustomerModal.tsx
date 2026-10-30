"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CustomerFormFields, useCustomerForm } from "./CustomerForm";
import type { Customer, CustomerInput } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: (data: CustomerInput) => void;
}

export function CustomerModal({ open, onClose, customer, onSave }: Props) {
  const form = useCustomerForm(customer, open);

  function handleSave() {
    if (!form.valid) return;
    onSave(form.toInput());
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? "Edit customer" : "Add customer"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.valid}>{customer ? "Save" : "Add"}</Button>
        </>
      }
    >
      <CustomerFormFields form={form} customer={customer} autoFocus={!customer} />
    </Modal>
  );
}
