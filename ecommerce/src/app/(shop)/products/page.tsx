import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { Listing, type SearchParams } from "@/components/listing/Listing";

const FLAG_TITLES: Record<string, string> = { featured: "Featured products", best_seller: "Best sellers", new_arrival: "New arrivals", on_offer: "Special offers" };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const search = await searchParams;
  const q = typeof search.q === "string" ? search.q : undefined;
  return {
    title: q ? `Search: ${q}` : (FLAG_TITLES[String(search.flag)] ?? "All products"),
    alternates: { canonical: "/products" },
    // Search and filter combinations are not indexed; the canonical listing is.
    robots: q || Object.keys(search).some((key) => key !== "page") ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const search = await searchParams;
  const title = typeof search.q === "string" && search.q ? "Search results" : (FLAG_TITLES[String(search.flag)] ?? "All products");
  return (
    <Container className="py-8">
      <Listing title={title} basePath="/products" search={search} />
    </Container>
  );
}
