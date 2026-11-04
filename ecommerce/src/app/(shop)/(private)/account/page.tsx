"use client";

import { useState } from "react";
import { Alert, Button, Card, TextField } from "@/components/ui";
import { api, errorMessage } from "@/services/api";
import { useStore } from "@/store/StoreProvider";
import type { Customer } from "@/types";

export default function ProfilePage() {
  const { customer, setCustomer } = useStore();
  const [name, setName] = useState(customer?.name ?? "");
  const [mobile, setMobile] = useState(customer?.mobile ?? "");
  const [profileState, setProfileState] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordState, setPasswordState] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!customer) return null;

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[6-9][0-9]{9}$/.test(mobile)) return setProfileState({ kind: "error", text: "Enter a 10-digit mobile number." });
    setSavingProfile(true);
    try {
      setCustomer(await api.patch<Customer>("/auth/me", { name: name.trim(), mobile }));
      setProfileState({ kind: "success", text: "Profile updated." });
    } catch (error) {
      setProfileState({ kind: "error", text: errorMessage(error) });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwords.next.length < 8) return setPasswordState({ kind: "error", text: "Use at least 8 characters." });
    if (passwords.next !== passwords.confirm) return setPasswordState({ kind: "error", text: "New passwords do not match." });
    setSavingPassword(true);
    try {
      await api.post("/auth/change-password", { currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: "", next: "", confirm: "" });
      setPasswordState({ kind: "success", text: "Password changed. Other devices have been signed out." });
    } catch (error) {
      setPasswordState({ kind: "error", text: errorMessage(error) });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My profile</h1>
      <Card className="p-6">
        <form onSubmit={saveProfile} className="max-w-lg space-y-4">
          {profileState && <Alert kind={profileState.kind}>{profileState.text}</Alert>}
          <TextField label="Full name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} />
          <TextField label="Email" value={customer.email} disabled hint="Contact support to change your email address." />
          <TextField label="Mobile number" value={mobile} inputMode="numeric" maxLength={10} onChange={(event) => setMobile(event.target.value.replace(/\D/g, ""))} required />
          <Button type="submit" loading={savingProfile}>
            Save changes
          </Button>
        </form>
      </Card>
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Change password</h2>
        <form onSubmit={changePassword} className="max-w-lg space-y-4">
          {passwordState && <Alert kind={passwordState.kind}>{passwordState.text}</Alert>}
          <TextField label="Current password" type="password" autoComplete="current-password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} required />
          <TextField label="New password" type="password" autoComplete="new-password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} required hint="At least 8 characters" />
          <TextField label="Confirm new password" type="password" autoComplete="new-password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} required />
          <Button type="submit" variant="dark" loading={savingPassword}>
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}
