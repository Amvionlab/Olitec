"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl py-16">
      <Alert tone="error" title="Unable to load this page">
        The data could not be loaded. Please retry, and contact the technical team if the problem continues.
      </Alert>
      <Button className="mt-4" variant="secondary" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
