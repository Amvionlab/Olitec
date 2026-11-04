"use client";

import { Container } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="max-w-xl py-16">
      <Alert tone="error" title="Something went wrong">
        We couldn’t load this page. Please try again in a moment.
      </Alert>
      <Button className="mt-4" variant="secondary" onClick={reset}>
        Try again
      </Button>
    </Container>
  );
}
