import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <Container aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-200/70" />
    </Container>
  );
}
