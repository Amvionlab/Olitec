import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CustomerUnifiedDashboard } from "@/components/customer/CustomerUnifiedDashboard";

export const metadata: Metadata = {
  title: "Customer Dashboard",
  description: "View your profile, registered products, warranties, and submitted requests.",
  robots: { index: false },
};

export default function WarrantiesPage() {
  return (
    <Container>
      <div className="py-6">
        <CustomerUnifiedDashboard />
      </div>
    </Container>
  );
}
