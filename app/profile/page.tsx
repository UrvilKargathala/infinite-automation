"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Lock, LogOut, Settings2, ShieldCheck, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { can, type Action } from "@/lib/utils/permissions";
import { CURRENCIES } from "@/lib/utils/currency";

/** Plain-language view of the permission matrix for this person's role. */
const ACCESS: { label: string; action: Action | null }[] = [
  { label: "Work on CRM records, quotes and stock", action: null },
  { label: "Raise and assign complaints", action: "manageComplaints" },
  { label: "Add, edit and import products", action: "editProducts" },
  { label: "Delete quotes", action: "deleteQuote" },
  { label: "Manage users", action: "viewUsers" },
  { label: "View the audit log", action: "viewAuditLog" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, reset } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => setFullName(user?.fullName ?? ""), [user?.fullName]);

  if (!user) return null;
  const me = user;
  const changed = fullName.trim() !== me.fullName && !!fullName.trim();

  async function handleSave() {
    if (!changed) return;
    const oldName = me.fullName;
    const newName = fullName.trim();
    setSaving(true);
    try {
      await updateProfile({ fullName: newName });
      // The server moved "Assigned to" across; mirror it so the board shows the new name straight away.
      useProjectStore.setState((s) => ({ projects: s.projects.map((p) => (p.assigned === oldName ? { ...p, assigned: newName } : p)) }));
      toast.success("Name updated", { description: "Your CRM and ticket assignments now show the new name." });
    } catch {
      // error toast already shown by the store
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/logout", { method: "POST" });
    reset();
    router.push("/login");
  }

  const inputClass =
    "w-full glass-control border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors";
  const lockedClass = "w-full flex items-center gap-2 rounded-lg py-2.5 px-3 text-sm bg-text-primary/[0.04] border border-border text-text-secondary";
  const cur = CURRENCIES[me.currency];

  return (
    <div>
      <h1 className="text-3xl font-normal text-text-primary">Profile</h1>
      <p className="text-sm text-text-secondary mt-1">Your details, your access, and what&apos;s waiting on you</p>

      <div className="mt-6 sm:mt-8">
        <ProfileHero user={me} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6 items-start">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <div className="flex items-start gap-4">
              <IconTile icon={UserRound} />
              <div>
                <h2 className="text-lg text-text-primary">Personal information</h2>
                <p className="text-sm text-text-secondary mt-0.5">Your name shows on chats, CRM records and complaints you&apos;re assigned.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="sm:col-span-2">
                <label className="block text-sm text-text-primary mb-1">Full name</label>
                <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} />
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Email</label>
                <div className={lockedClass}><Lock size={14} className="text-text-muted shrink-0" /><span className="truncate">{me.email}</span></div>
                <p className="text-xs text-text-muted mt-1.5">You sign in with this — ask a Super Admin to change it.</p>
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Role</label>
                <div className={lockedClass}><Lock size={14} className="text-text-muted shrink-0" />{me.role}</div>
                <p className="text-xs text-text-muted mt-1.5">Roles are set in User Management.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              {changed && <Button variant="secondary" onClick={() => setFullName(me.fullName)}>Discard</Button>}
              <Button icon={Check} onClick={handleSave} disabled={!changed || saving}>{saving ? "Saving…" : "Save changes"}</Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <IconTile icon={ShieldCheck} />
              <div>
                <h2 className="text-lg text-text-primary">What you can do</h2>
                <p className="text-sm text-text-secondary mt-0.5">Based on your {me.role} role.</p>
              </div>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5">
              {ACCESS.map(({ label, action }) => {
                const ok = action === null || can(me.role, action);
                return (
                  <li key={label} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ${ok ? "bg-success/[0.07] text-text-primary" : "bg-text-primary/[0.03] text-text-muted"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-success text-white" : "bg-text-primary/10 text-text-muted"}`}>
                      {ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg text-text-primary">Preferences</h2>
              <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:underline">
                <Settings2 size={14} /> Settings
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl glass-tile px-3.5 py-3">
                <span className="min-w-[36px] h-9 px-2 rounded-xl bg-brand-gradient text-white flex items-center justify-center text-sm">{cur.symbol}</span>
                <div className="min-w-0">
                  <div className="text-sm text-text-primary">{cur.name}</div>
                  <div className="text-xs text-text-muted">Currency for prices and new quotes</div>
                </div>
              </div>
              {[
                { label: "New ticket alerts", on: me.ticketAlerts },
                { label: "Quote status alerts", on: me.quoteAlerts },
              ].map(({ label, on }) => (
                <div key={label} className="flex items-center justify-between text-sm px-1">
                  <span className="text-text-secondary">{label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${on ? "bg-success/10 text-success" : "bg-text-primary/[0.06] text-text-muted"}`}>{on ? "On" : "Off"}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg text-text-primary">Account</h2>
            <p className="text-sm text-text-secondary mt-1">Sign out of this device. You&apos;ll need your email and password to sign back in.</p>
            <Button variant="danger" icon={LogOut} onClick={handleSignOut} className="w-full justify-center mt-4">Sign out</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
