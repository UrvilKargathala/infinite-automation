"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Mail, Shield } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RoleBadge } from "@/components/users/RoleBadge";
import { useAuthStore } from "@/lib/store/useAuthStore";

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [fullName, setFullName] = useState(user.fullName);

  useEffect(() => {
    setFullName(user.fullName);
  }, [user.fullName]);

  function handleSave() {
    if (!fullName.trim()) return;
    updateProfile({ fullName: fullName.trim() });
    toast.success("Profile updated");
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-text-primary">Profile</h1>
      <p className="text-sm text-text-secondary mt-1">Manage your personal information</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
        {/* Left — summary card */}
        <Card className="lg:col-span-1 flex flex-col items-center text-center">
          <Avatar name={user.fullName} size="xl" />
          <div className="text-lg text-text-primary mt-4">{user.fullName}</div>
          <div className="mt-2">
            <RoleBadge role={user.role} />
          </div>
          <div className="w-full mt-6 pt-6 border-t border-border space-y-3 text-left">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Mail size={15} className="text-text-muted shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Shield size={15} className="text-text-muted shrink-0" />
              <span>{user.role}</span>
            </div>
          </div>
        </Card>

        {/* Right — editable details */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg text-text-primary mb-5">Personal information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Email" value={user.email} disabled className="opacity-60 cursor-not-allowed" />
            <div>
              <label className="block text-sm text-text-primary mb-1">Role</label>
              <RoleBadge role={user.role} />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={!fullName.trim() || fullName.trim() === user.fullName}>
              Save changes
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
