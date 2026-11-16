import type { Metadata } from "next";
import { AuthModal } from "@/components/auth/AuthModal";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return <AuthModal embedded initialMode="login" />;
}
