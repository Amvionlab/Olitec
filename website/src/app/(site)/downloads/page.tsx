import type { Metadata } from "next";
import { downloadsPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { DownloadsHub } from "@/components/downloads/DownloadsHub";

export const metadata: Metadata = {
  title: "Downloads",
  description: downloadsPage.lead,
  alternates: { canonical: "/downloads" },
};

export default function DownloadsPage() {
  return (
    <LegacyPage>
      <DownloadsHub />
    </LegacyPage>
  );
}
