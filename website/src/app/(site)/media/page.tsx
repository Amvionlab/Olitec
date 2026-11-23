import type { Metadata } from "next";
import { MediaPageClient } from "./MediaPageClient";

export const metadata: Metadata = {
  title: "Media & Updates | OLITEC",
  description: "Latest news, articles, video features and industry insights from Olitec Solar.",
  alternates: { canonical: "/media" },
};

export default function MediaPage() {
  return <MediaPageClient />;
}
