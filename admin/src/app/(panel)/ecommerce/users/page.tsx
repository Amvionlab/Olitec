"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PasswordField } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { useEcom } from "@/components/ecommerce/EcomSession";
import { Field, LoadState, Modal, Pill, RequirePermission, inputClass, useAction, useApi } from "@/components/ecommerce/kit";
import { formatDateTime } from "@/lib/format";
import { ecomApi, label } from "@/services/ecommerce/api";

interface Staff {
  id: number;
  name: string;
  email: string;
  warrantyRole: string;
  shopRole: string | null;
  shopRoleLabel: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

interface Roles {
  roles: { role: string; label: string; permissions: string[] }[];
  permissions: string[];
}

function UsersContent() {
  const { admin } = useEcom();
  const users = useApi<Staff[]>("/admin/users");
  const roles = useApi<Roles>("/admin/users/roles");
  const { run, busy } = useAction();
  const [creating, setCreating] = useState<{ name: string; email: string; password: string; role: string } | null>(null);

  const update = async (user: Staff, body: { role?: string | null; isActive?: boolean }) => {
    await run(() => ecomApi.patch(`/admin/users/${user.id}`, body), "Staff access updated (their sessions were signed out)");
    users.reload();
  };

  return (
    <>
      <PageHeader title="Shop staff" description="Shop roles are separate from warranty-panel roles. Super Admins always have full access." actions={<Button onClick={() => setCreating({ name: "", email: "", password: "", role: "order_manager" })}><Plus className="size-4" aria-hidden /> Add staff</Button>} />
      <div className="space-y-6">
        <Card>
          <LoadState loading={users.loading} error={users.error} empty={!users.data}>
            <Table>
              <THead><tr><Th>Name</Th><Th>Warranty role</Th><Th>Shop role</Th><Th>Last sign-in</Th><Th>Status</Th></tr></THead>
              <TBody>
                {users.data?.map((user) => {
                  const locked = user.warrantyRole === "super_admin" || user.id === admin.id;
                  return (
                    <tr key={user.id}>
                      <Td><span className="font-medium">{user.name}</span><span className="block text-xs text-slate-500">{user.email}</span></Td>
                      <Td className="text-xs">{user.warrantyRole === "none" ? "—" : label(user.warrantyRole)}</Td>
                      <Td>
                        {locked ? <Pill tone="blue">{user.shopRoleLabel}</Pill> : (
                          <select aria-label={`Shop role for ${user.name}`} className={`${inputClass} w-48`} value={user.shopRole ?? ""} disabled={busy} onChange={(event) => void update(user, { role: event.target.value || null })}>
                            <option value="">No shop access</option>
                            {roles.data?.roles.map((role) => <option key={role.role} value={role.role}>{role.label}</option>)}
                          </select>
                        )}
                      </Td>
                      <Td className="text-xs">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}</Td>
                      <Td>
                        {locked ? (user.isActive ? <Pill tone="green">Active</Pill> : <Pill>Disabled</Pill>) : (
                          <Button size="sm" variant={user.isActive ? "secondary" : "primary"} disabled={busy} onClick={() => void update(user, { isActive: !user.isActive })}>{user.isActive ? "Disable" : "Enable"}</Button>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          </LoadState>
        </Card>
        {roles.data && (
          <Card>
            <CardHeader title="What each role can do" description="Permissions are enforced by the API on every request." />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2">Permission</th>{roles.data.roles.map((role) => <th key={role.role} className="px-3 py-2 text-center">{role.label}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {roles.data.permissions.map((permission) => (
                    <tr key={permission}><td className="px-3 py-1.5 font-mono">{permission}</td>{roles.data!.roles.map((role) => <td key={role.role} className="px-3 py-1.5 text-center">{role.permissions.includes(permission) ? "✓" : ""}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal open={creating !== null} title="Add shop staff" onClose={() => setCreating(null)}>
        {creating && (
          <form className="space-y-4" onSubmit={async (event) => {
            event.preventDefault();
            const ok = await run(() => ecomApi.post("/admin/users", { ...creating, name: creating.name.trim(), email: creating.email.trim() }), "Staff account created");
            if (ok) { setCreating(null); users.reload(); }
          }}>
            <Field label="Name *"><input className={inputClass} required minLength={2} maxLength={100} value={creating.name} onChange={(event) => setCreating({ ...creating, name: event.target.value })} /></Field>
            <Field label="Email *"><input className={inputClass} type="email" required value={creating.email} onChange={(event) => setCreating({ ...creating, email: event.target.value })} /></Field>
            <PasswordField label="Temporary password" required minLength={8} hint="At least 8 characters. Ask them to change it after first sign-in." value={creating.password} onChange={(event) => setCreating({ ...creating, password: event.target.value })} />
            <Field label="Shop role">
              <select className={inputClass} value={creating.role} onChange={(event) => setCreating({ ...creating, role: event.target.value })}>
                {roles.data?.roles.map((role) => <option key={role.role} value={role.role}>{role.label}</option>)}
              </select>
            </Field>
            <p className="text-xs text-slate-500">The account gets no warranty-panel role.</p>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setCreating(null)}>Cancel</Button><Button type="submit" loading={busy}>Create</Button></div>
          </form>
        )}
      </Modal>
    </>
  );
}

export default function UsersPage() {
  return (
    <RequirePermission permission="users.manage">
      <UsersContent />
    </RequirePermission>
  );
}
