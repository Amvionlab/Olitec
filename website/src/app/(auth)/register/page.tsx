import type { Metadata } from "next";
import { AuthModal } from "@/components/auth/AuthModal";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function RegisterPage() {
  return <AuthModal embedded initialMode="register" />;
}
