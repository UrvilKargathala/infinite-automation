"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Users2, Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { IconTile } from "@/components/ui/IconTile";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { TablePageSkeleton } from "@/components/ui/TablePageSkeleton";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerModal } from "@/components/customers/CustomerModal";
import { CustomerDetailPanel } from "@/components/customers/CustomerDetailPanel";
import type { Customer, CustomerSegment } from "@/types";

const segments: CustomerSegment[] = [
  "Residential", "Hospitality", "Government / Council", "Retail", "Healthcare / Aged Care", "Industrial",
];

export default function CustomersPage() {
  const { customers, fetchAll, loaded, add, update, remove } = useCustomerStore();
  const loading = !loaded;

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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

  const totalSegments = new Set(customers.map((c) => c.segment)).size;

  function handleEdit(c: Customer) {
    setEditCustomer(c);
    setModalOpen(true);
  }

  function handleDelete(id: number) {
    if (window.confirm("Delete this customer? Linked tickets, projects, and quotes will keep their history but lose the link.")) {
      remove(id).then(() => toast.success("Customer deleted")).catch(() => {
        // error toast already shown by the store
      });
    }
  }

  function handleSave(data: Omit<Customer, "id" | "createdAt">) {
    if (editCustomer) {
      update(editCustomer.id, data).then(() => toast.success("Customer updated")).catch(() => {});
    } else {
      add(data).then(() => toast.success("Customer added")).catch(() => {});
    }
  }

  if (loading) return <TablePageSkeleton statCards={2} />;

  return (
    <div>
      <h1 className="text-3xl font-semibold text-text-primary">Customers</h1>
      <p className="text-sm text-text-secondary mt-1">Every customer, with their tickets, projects, and quotes in one place</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
        <div className="rounded-2xl shadow-card backdrop-blur-xl border border-white/40 p-5 flex items-center justify-between bg-[#3A90C318]" style={{ borderLeft: "3px solid #3A90C3" }}>
          <div>
            <div className="text-xs text-text-muted">Total customers</div>
            <div className="text-2xl font-light mt-1 text-text-primary"><Num>{customers.length}</Num></div>
          </div>
          <IconTile icon={Users2} />
        </div>
        <div className="rounded-2xl shadow-card backdrop-blur-xl border border-white/40 p-5 flex items-center justify-between bg-[#44BE4A18]" style={{ borderLeft: "3px solid #44BE4A" }}>
          <div>
            <div className="text-xs text-text-muted">Segments represented</div>
            <div className="text-2xl font-light mt-1 text-text-primary"><Num>{totalSegments}</Num></div>
          </div>
          <IconTile icon={Building2} />
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 overflow-hidden mt-6">
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="w-full sm:w-64 bg-white border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
          >
            <option value="">All segments</option>
            {segments.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="ml-auto">
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
