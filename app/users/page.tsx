"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Search, Users as UsersIcon, CheckCircle, Shield, Plus } from "lucide-react";
import { useUserStore } from "@/lib/store/useUserStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { can } from "@/lib/utils/permissions";
import { IconTile } from "@/components/ui/IconTile";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { UserTable } from "@/components/users/UserTable";
import { UserModal } from "@/components/users/UserModal";
import { TablePageSkeleton } from "@/components/ui/TablePageSkeleton";
import type { Role, User } from "@/types";

export default function UsersPage() {
  const { users, add, update, remove } = useUserStore();
  const currentRole = useAuthStore((s) => s.user.role);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const totalActive = users.filter((u) => u.status === "Active").length;
  const totalAdmins = users.filter((u) => u.role === "Super Admin" || u.role === "Admin").length;

  if (loading) return <TablePageSkeleton statCards={3} />;

  if (!can(currentRole, "viewUsers")) {
    return (
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">User Management</h1>
        <div className="mt-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-12 text-center text-text-secondary">
          You don&apos;t have permission to view this page.
        </div>
      </div>
    );
  }

  const assignableRoles: Role[] =
    currentRole === "Super Admin" ? ["Super Admin", "Admin", "Staff"] : ["Staff"];

  function canEditUser(u: User) {
    if (currentRole === "Super Admin") return true;
    if (currentRole === "Admin") return u.role === "Staff";
    return false;
  }

  function canDeleteUser() {
    return can(currentRole, "deleteUser");
  }

  function handleAdd() {
    setEditUser(null);
    setModalOpen(true);
  }

  function handleEdit(u: User) {
    setEditUser(u);
    setModalOpen(true);
  }

  function handleDelete(id: number) {
    if (window.confirm("Delete this user?")) {
      remove(id);
      toast.success("User deleted");
    }
  }

  function handleSave(data: Omit<User, "id">) {
    if (editUser) {
      update(editUser.id, data);
      toast.success("User updated");
    } else {
      add(data);
      toast.success("User added");
    }
  }

  const stats = [
    { label: "Total users", value: users.length, icon: UsersIcon, bg: "bg-[#3A90C318]", accent: "#3A90C3" },
    { label: "Active", value: totalActive, icon: CheckCircle, valueClass: "text-success", bg: "bg-[#10B98118]", accent: "#10B981" },
    { label: "Admins & Super Admins", value: totalAdmins, icon: Shield, bg: "bg-[#8B5CF618]", accent: "#8B5CF6" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-text-primary">User Management</h1>
      <p className="text-sm text-text-secondary mt-1">Manage users and role-based access</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl shadow-card backdrop-blur-xl border border-white/40 p-5 flex items-center justify-between ${s.bg}`} style={{ borderLeft: `3px solid ${s.accent}` }}>
            <div>
              <div className="text-xs text-text-muted">{s.label}</div>
              <div className={`text-2xl font-light mt-1 ${s.valueClass ?? "text-text-primary"}`}>
                <Num>{s.value}</Num>
              </div>
            </div>
            <IconTile icon={s.icon} />
          </div>
        ))}
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 overflow-hidden mt-6">
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="w-full sm:w-64 bg-white border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ml-auto">
            <Button icon={Plus} onClick={handleAdd}>
              Add user
            </Button>
          </div>
        </div>

        <UserTable
          users={filtered}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={canEditUser}
          canDelete={canDeleteUser}
        />
      </div>

      <UserModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditUser(null); }}
        user={editUser}
        assignableRoles={assignableRoles}
        onSave={handleSave}
      />
    </div>
  );
}
