"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSettingsStore } from "@/lib/store/useSettingsStore";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full shrink-0 relative transition-colors ${
        checked ? "bg-brand-blue" : "bg-border"
      }`}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(0)" }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { emailNotifs, leadAlerts, quoteAlerts, setSetting } = useSettingsStore();

  function handleToggle(key: "emailNotifs" | "leadAlerts" | "quoteAlerts", value: boolean, label: string) {
    setSetting(key, value);
    toast.success(`${label} ${value ? "enabled" : "disabled"}`);
  }

  function handleSignOut() {
    localStorage.removeItem("ia_logged_in");
    router.push("/login");
  }

  const rows = [
    { key: "emailNotifs" as const, label: "Email notifications", desc: "Receive a daily summary by email", value: emailNotifs },
    { key: "leadAlerts" as const, label: "New lead alerts", desc: "Notify me when a new lead is created", value: leadAlerts },
    { key: "quoteAlerts" as const, label: "Quote status alerts", desc: "Notify me when a quote is accepted or rejected", value: quoteAlerts },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-text-primary">Settings</h1>
      <p className="text-sm text-text-secondary mt-1">Manage notifications and account preferences</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
        <Card className="lg:col-span-2">
          <h2 className="text-lg text-text-primary mb-4">Notifications</h2>
          <div className="space-y-4">
            {rows.map(({ key, label, desc, value }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-text-primary">{label}</div>
                  <div className="text-xs text-text-muted mt-0.5">{desc}</div>
                </div>
                <Toggle checked={value} onChange={(v) => handleToggle(key, v, label)} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <h2 className="text-lg text-text-primary mb-4">Account</h2>
          <p className="text-xs text-text-muted mb-4">Sign out of your session on this device.</p>
          <Button variant="danger" icon={LogOut} onClick={handleSignOut}>
            Sign out
          </Button>
        </Card>
      </div>
    </div>
  );
}
