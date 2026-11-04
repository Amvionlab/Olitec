import { AdminShell } from "@/components/layout/AdminShell";
import { getCurrentAdmin } from "@/services/session";

// Phase 2: verify the admin session here and redirect to /login when it is missing or expired.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
