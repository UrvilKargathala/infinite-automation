"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Pagination } from "@/components/ui/Pagination";
import { RoleBadge } from "@/components/users/RoleBadge";
import type { User } from "@/types";

const PAGE_SIZE = 10;

interface Props {
  users: User[];
  onEdit: (u: User) => void;
  onDelete: (id: number) => void;
  canEdit: (u: User) => boolean;
  canDelete: (u: User) => boolean;
}

export function UserTable({ users, onEdit, onDelete, canEdit, canDelete }: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const safePage = Math.min(page, totalPages || 1);
  const paged = users.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const thClass = "px-4 py-3 text-xs uppercase tracking-wider text-text-muted font-normal text-left";
  const tdClass = "px-4 py-3 text-sm";

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-surface-alt">
              <th className={thClass}>Name</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Role</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-text-muted py-12">
                  No users found
                </td>
              </tr>
            ) : (
              paged.map((u) => {
                const editable = canEdit(u);
                const deletable = canDelete(u);
                return (
                  <tr key={u.id} className="border-t border-border hover:bg-[#F9FAFB]/60">
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} size="sm" />
                        <span className="text-text-primary">{u.fullName}</span>
                      </div>
                    </td>
                    <td className={`${tdClass} text-text-secondary`}>{u.email}</td>
                    <td className={tdClass}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td className={tdClass}>
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: (u.status === "Active" ? "#10B981" : "#94A3B8") + "18",
                          color: u.status === "Active" ? "#10B981" : "#94A3B8",
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(u)}
                          disabled={!editable}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-[#F9FAFB] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          aria-label="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(u.id)}
                          disabled={!deletable}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-danger hover:bg-[#F9FAFB] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          aria-label="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={users.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </>
  );
}
