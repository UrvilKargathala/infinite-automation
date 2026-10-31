"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Users as UsersIcon, CheckCircle, Shield, Plus } from "lucide-react";
import { useUserStore } from "@/lib/store/useUserStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { can } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/Button";
import { UserTable } from "@/components/users/UserTable";
import { UserModal } from "@/components/users/UserModal";
import { TablePageSkeleton } from "@/components/ui/TablePageSkeleton";
import type { Role, User } from "@/types";
import { StatCard } from "@/components/ui/StatCard";

export default function UsersPage() {
  const { users, add, update, remove, loaded } = useUserStore();
  const currentRole = useAuthStore((s) => s.user?.role ?? "Purchase");

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const loading = !loaded;

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
        <h1 className="text-3xl font-normal text-text-primary">User Management</h1>
        <div className="mt-8 glass rounded-3xl p-12 text-center text-text-secondary">
          You don&apos;t have permission to view this page.
        </div>
      </div>
    );
  }

  const assignableRoles: Role[] =
    currentRole === "Super Admin" ? ["Super Admin", "Admin", "Purchase"] : ["Purchase"];

  function canEditUser(u: User) {
    if (currentRole === "Super Admin") return true;
    if (currentRole === "Admin") return u.role === "Purchase";
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
      remove(id).then(() => toast.success("User deleted")).catch(() => {
        // error toast already shown by the store
      });
    }
  }

  async function handleSave(data: Omit<User, "id">) {
    try {
      if (editUser) {
        await update(editUser.id, data);
        toast.success("User updated");
      } else {
        await add(data);
        toast.success("User added");
      }
    } catch {
      // error toast already shown by the store
    }
  }

  const stats = [
    { label: "Total users", value: users.length, icon: UsersIcon },
    { label: "Active", value: totalActive, icon: CheckCircle, valueClass: "text-success" },
    { label: "Admins & Super Admins", value: totalAdmins, icon: Shield },
  ];

  return (
    <div>
      <h1 className="text-3xl font-normal text-text-primary">User Management</h1>
      <p className="text-sm text-text-secondary mt-1">Manage users and role-based access</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} valueClass={s.valueClass} />
        ))}
      </div>

      <div className="glass rounded-3xl overflow-hidden mt-6">
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 pointer-events-none text-text-secondary" />
            <input
              className="w-full sm:w-64 glass-control border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
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
