import { siteConfig } from "@/lib/site";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * Renders schema.org BreadcrumbList JSON-LD for search engines and AI crawlers.
 */
export function BreadcrumbJsonLd({ items }: { items: readonly BreadcrumbItem[] }) {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      ...items.map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 2,
        name: item.name,
        item: `${baseUrl}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * Renders schema.org FAQPage JSON-LD matching visible FAQ items on the page.
 */
export function FaqJsonLd({
  items,
}: {
  items: readonly { readonly question: string; readonly answer: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
    />
  );
}
