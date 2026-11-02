"use client";

import { useOpenParam } from "@/lib/hooks/useOpenParam";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { useState, useMemo, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Search, Users2, Building2, Plus, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { Button } from "@/components/ui/Button";
import { TablePageSkeleton } from "@/components/ui/TablePageSkeleton";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerModal } from "@/components/customers/CustomerModal";
import { CustomerDetailPanel } from "@/components/customers/CustomerDetailPanel";
import type { Customer, CustomerInput, CustomerSegment } from "@/types";
import { customerFullName, formatSrNo } from "@/lib/utils/customer";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";

const segments: CustomerSegment[] = [
  "Residential", "Hospitality", "Government / Council", "Retail", "Healthcare / Aged Care", "Industrial",
];

export default function CustomersPage() {
  const { customers, fetchAll, loaded, add, update, remove } = useCustomerStore();
  const loading = !loaded;

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [viewCustomerId, setViewCustomerId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let list = customers;
    if (segmentFilter) list = list.filter((c) => c.segment === segmentFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.contactName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, segmentFilter, search]);

  // ?open=<id> (search, links) opens that customer's detail panel.
  useOpenParam(!loading, (id) => { if (customers.some((c) => c.id === id)) setViewCustomerId(id); });

  const totalSegments = new Set(customers.map((c) => c.segment)).size;

  function handleExport() {
    const rows = filtered.map((c) => ({
      "SR No": formatSrNo(c.id), Code: c.customerCode, Prefix: c.prefix, Name: c.firstName, Surname: c.surname,
      Mobile: c.phone, Email: c.email, Architect: c.architect, "GST No": c.gstNo, Address: c.address,
      City: c.city, State: c.state, Postcode: c.postcode, Birthday: c.birthday, Segment: c.segment, Notes: c.notes,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Customers");
    XLSX.writeFile(wb, "infinite_customers_export.xlsx");
    toast.success(`${rows.length} customers exported`);
  }

  // Appends only; rows whose Name already exists (or repeats in the file) are skipped.
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);
    const col = (r: Record<string, unknown>, k: string) => {
      const key = Object.keys(r).find((x) => x.trim().toLowerCase() === k.toLowerCase());
      return key ? String(r[key] ?? "").trim() : "";
    };
    const seen = new Set(customers.map((c) => c.name.toLowerCase()));
    let added = 0;
    try {
      for (const r of rows) {
        // "Name" + optional "Surname" (older exports put the full name in Name, which still works).
        const firstName = col(r, "Name");
        const surname = col(r, "Surname");
        const name = customerFullName(firstName, surname);
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        const seg = segments.find((x) => x.toLowerCase() === col(r, "Segment").toLowerCase());
        await add({
          name, firstName, surname, prefix: col(r, "Prefix"), segment: seg ?? "Residential", contactName: col(r, "Contact"),
          email: col(r, "Email"), phone: col(r, "Mobile") || col(r, "Phone"), architect: col(r, "Architect"), gstNo: col(r, "GST No").toUpperCase(),
          address: col(r, "Address"), city: col(r, "City"), state: col(r, "State"), postcode: col(r, "Postcode"), notes: col(r, "Notes"),
        });
        added++;
      }
    } catch {
      // error toast already shown by the store
    }
    if (added) toast.success(`${added} customers imported`);
    else toast.error("No new customers found (needs a Name column; existing names are skipped)");
  }

  function handleEdit(c: Customer) {
    setEditCustomer(c);
    setModalOpen(true);
  }

  async function handleDelete(id: number) {
    if (await confirmDialog({ title: "Delete this customer?", message: "Linked tickets, projects, and quotes will keep their history but lose the link.", confirmLabel: "Delete", tone: "danger" })) {
      remove(id).then(() => toast.success("Customer deleted")).catch(() => {
        // error toast already shown by the store
      });
    }
  }

  function handleSave(data: CustomerInput) {
    if (editCustomer) {
      update(editCustomer.id, data).then(() => toast.success("Customer updated")).catch(() => {});
    } else {
      add(data).then(() => toast.success("Customer added")).catch(() => {});
    }
  }

  if (loading) return <TablePageSkeleton statCards={2} />;

  return (
    <div>
      <h1 className="text-3xl font-normal text-text-primary">Customers</h1>
      <p className="text-sm text-text-secondary mt-1">Every customer, with their tickets, projects, and quotes in one place</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
        <StatCard label="Total customers" value={customers.length} icon={Users2} />
        <StatCard label="Segments represented" value={totalSegments} icon={Building2} />
      </div>

      <div className="glass rounded-3xl overflow-hidden mt-6">
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 pointer-events-none text-text-secondary" />
            <input
              className="w-full sm:w-64 glass-control border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            className="glass-control border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
          >
            <option value="">All segments</option>
            {segments.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div className="ml-auto flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>Import Excel</Button>
            <Button variant="secondary" icon={Download} onClick={handleExport}>Export</Button>
            <Button icon={Plus} onClick={() => { setEditCustomer(null); setModalOpen(true); }}>
              Add customer
            </Button>
          </div>
        </div>

        <CustomerTable
          customers={filtered}
          onView={(c) => setViewCustomerId(c.id)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <CustomerModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditCustomer(null); }}
        customer={editCustomer}
        onSave={handleSave}
      />

      <CustomerDetailPanel customerId={viewCustomerId} onClose={() => setViewCustomerId(null)} />
    </div>
  );
}
