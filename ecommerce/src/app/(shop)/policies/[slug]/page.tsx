import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { getPage } from "@/services/catalog";
import { formatDate, paragraphs } from "@/utils/format";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage((await params).slug);
  if (!page) return { title: "Page not found" };
  return { title: page.seoTitle ?? page.title, description: page.seoDescription ?? undefined, alternates: { canonical: `/policies/${page.slug}` } };
}

/**
 * About, shipping, returns, privacy, terms and warranty pages. Text is written and published by the business in
 * Admin → Content → Pages; it is rendered as plain text (never HTML). Unpublished pages return 404.
 */
export default async function PolicyPage({ params }: Props) {
  const page = await getPage((await params).slug);
  if (!page) notFound();
  return (
    <Container className="max-w-3xl py-10">
      <article className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-10">
        <h1 className="text-3xl font-bold text-slate-900">{page.title}</h1>
        <p className="text-xs text-slate-500">Last updated {formatDate(page.updatedAt)}</p>
        {paragraphs(page.body).map((text, index) => (
          <p key={index} className="whitespace-pre-line leading-relaxed text-slate-700">
            {text}
          </p>
        ))}
      </article>
    </Container>
  );
}
