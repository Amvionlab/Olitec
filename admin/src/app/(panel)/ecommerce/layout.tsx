import type { Metadata } from "next";
import { EcomSession } from "@/components/ecommerce/EcomSession";

export const metadata: Metadata = { title: { default: "E-Commerce", template: "%s · E-Commerce | Olitech Admin" } };

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  return <EcomSession>{children}</EcomSession>;
}
