import type { Metadata } from "next";
import { Container, EmptyState } from "@/components/ui";
import { FaqList } from "@/components/home/Sections";
import { api } from "@/services/api";
import type { ContentBlock } from "@/types";

export const metadata: Metadata = { title: "Frequently asked questions", alternates: { canonical: "/faqs" } };
export const revalidate = 60;

export default async function FaqsPage() {
  const faqs = await api.get<ContentBlock[]>("/content/faqs").catch(() => []);
  const structuredData = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.title, acceptedAnswer: { "@type": "Answer", text: faq.body ?? "" } })),
      }
    : null;
  return (
    <Container className="max-w-3xl space-y-6 py-10">
      {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />}
      <h1 className="text-3xl font-bold text-slate-900">Frequently asked questions</h1>
      {faqs.length ? <FaqList faqs={faqs} /> : <EmptyState title="No FAQs published yet">Have a question? Use the contact page and we will help.</EmptyState>}
    </Container>
  );
}
