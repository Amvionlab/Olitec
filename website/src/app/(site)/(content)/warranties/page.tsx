import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { WarrantiesContent } from "@/components/warranties/WarrantiesContent";

export const metadata: Metadata = { title: "My warranties", robots: { index: false } };

export default function WarrantiesPage() {
  return (
    <Container>
      <div className="reveal-on-scroll">
        <PageHeader
          title="My warranties"
          description="Warranty status for every product registered to your account."
          actions={
            <>
              <ButtonLink href="/profile" variant="secondary">
                My profile
              </ButtonLink>
              <ButtonLink href="/warranties/register">
                <Plus className="size-4" aria-hidden /> Register a product
              </ButtonLink>
            </>
          }
        />
      </div>

      <div className="reveal-on-scroll reveal-delay-1">
        <Suspense fallback={<div className="p-8 text-center text-sm text-muted">Loading warranties...</div>}>
          <WarrantiesContent />
        </Suspense>
      </div>
    </Container>
  );
}
