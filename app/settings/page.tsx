"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, FileCheck, LogOut, Mail, Ticket, UserRound, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { IconTile } from "@/components/ui/IconTile";
import { RoleBadge } from "@/components/users/RoleBadge";
import { CurrencySettings } from "@/components/settings/CurrencySettings";
import { useAuthStore } from "@/lib/store/useAuthStore";

function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full shrink-0 relative transition-colors ${
        checked ? "bg-brand-gradient" : "bg-text-primary/15"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

type Row = { key: "ticketAlerts" | "quoteAlerts" | null; icon: LucideIcon; label: string; desc: string; value: boolean; soon?: boolean };

export default function SettingsPage() {
  const router = useRouter();
  const { user, reset, updateProfile } = useAuthStore();

  async function handleToggle(key: "ticketAlerts" | "quoteAlerts", value: boolean, label: string) {
    try {
      await updateProfile({ [key]: value });
      toast.success(`${label} ${value ? "on" : "off"}`);
    } catch {
      // error toast already shown by the store
    }
  }

  async function handleSignOut() {
    await fetch("/api/logout", { method: "POST" });
    reset();
    router.push("/login");
  }

  const rows: Row[] = [
    { key: "ticketAlerts", icon: Ticket, label: "New ticket alerts", desc: "Tell me in-app when a new ticket is created", value: user?.ticketAlerts ?? true },
    { key: "quoteAlerts", icon: FileCheck, label: "Quote status alerts", desc: "Tell me in-app when a quote is accepted or rejected", value: user?.quoteAlerts ?? false },
    { key: null, icon: Mail, label: "Daily email summary", desc: "A morning digest of tickets, quotes and stock", value: false, soon: true },
  ];

  return (
    <div>
      <h1 className="text-3xl font-normal text-text-primary">Settings</h1>
      <p className="text-sm text-text-secondary mt-1">Your currency, notifications and account</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8 items-start">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <CurrencySettings />

          <Card>
            <div className="flex items-start gap-4">
              <IconTile icon={Bell} />
              <div>
                <h2 className="text-lg text-text-primary">Notifications</h2>
                <p className="text-sm text-text-secondary mt-0.5">Choose what shows up in your notification bell.</p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-white/70">
              {rows.map(({ key, icon: Icon, label, desc, value, soon }) => (
                <div key={label} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  <span className="w-9 h-9 rounded-xl bg-white/60 border border-white/80 flex items-center justify-center shrink-0 text-text-secondary">
                    <Icon size={17} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary">
                      {label}
                      {soon && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-text-primary/[0.06] text-text-muted">Coming soon</span>}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">{desc}</div>
                  </div>
                  <Toggle
                    label={label}
                    checked={value}
                    disabled={soon}
                    onChange={(v) => key && handleToggle(key, v, label)}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="flex flex-col items-center text-center">
          {user && (
            <>
              <Avatar name={user.fullName} size="xl" />
              <div className="mt-4 text-lg text-text-primary">{user.fullName}</div>
              <div className="text-sm text-text-muted break-all">{user.email}</div>
              <div className="mt-3"><RoleBadge role={user.role} /></div>
            </>
          )}
          <div className="w-full mt-6 pt-5 border-t border-white/70 space-y-2">
            <Button variant="secondary" icon={UserRound} onClick={() => router.push("/profile")} className="w-full justify-center">
              Edit profile
            </Button>
            <Button variant="danger" icon={LogOut} onClick={handleSignOut} className="w-full justify-center">
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
