import type { Metadata } from "next";
import { MediaPageClient } from "./MediaPageClient";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Media, Press Releases & Solar Energy News",
  description:
    "Latest product announcements, Katpadi manufacturing updates, and clean-energy insights on Olitec hybrid inverters and LFP storage systems.",
  alternates: { canonical: "/media" },
};

export default function MediaPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Media", path: "/media" }]} />
      <MediaPageClient />
    </>
  );
}
