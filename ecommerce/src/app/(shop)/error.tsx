"use client";

import { useEffect } from "react";
import { Alert, Button, Container } from "@/components/ui";

/** Error boundary for shop pages. Details stay in the browser console; customers see a plain message. */
export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Container className="space-y-4 py-16">
      <Alert>Something went wrong while loading this page. Please try again.</Alert>
      <Button onClick={reset}>Try again</Button>
    </Container>
  );
}
