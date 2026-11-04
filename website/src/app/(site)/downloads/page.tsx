/** Downloads — from the Olitec HTML design (Olitec-Website/downloads.html). PDFs are in public/downloads/. */
import type { Metadata } from "next";
import Link from "next/link";
import { downloadsPage } from "@/content/pages";
import { LegacyIcon } from "@/components/legacy/icons";
import { IconTile, LegacyCard, LegacyPage, PageHero, Section, headingFont, legacyButton, legacyButtonSecondary } from "@/components/legacy/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Downloads",
  description: downloadsPage.lead,
  alternates: { canonical: "/downloads" },
};

export default function DownloadsPage() {
  const { groups, restricted } = downloadsPage;
  return (
    <LegacyPage>
      <PageHero art="synergy" eyebrow={downloadsPage.eyebrow} title={downloadsPage.title} lead={downloadsPage.lead} />

      <Section>
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className={cn(headingFont, "mb-2 text-[26px] font-semibold")}>{group.title}</h2>
            <ul className="mb-12 border-b border-[#e6e6e6]">
              {group.files.map((file) => (
                <li key={file.href} className="flex flex-wrap items-center gap-[18px] border-t border-[#e6e6e6] py-[22px]">
                  <IconTile icon="file" size={52} />
                  <div className="min-w-0 flex-[1_1_360px]">
                    <div className="text-[19px] font-semibold text-black">{file.title}</div>
                    <div className="text-[15px] text-muted">{file.description}</div>
                  </div>
                  <span className="flex-none text-sm text-muted">{file.size}</span>
                  <a className={cn(legacyButtonSecondary, "flex-none")} href={file.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${file.title} (PDF, opens in a new tab)`}>
                    <LegacyIcon name="download" size={18} strokeWidth={2} />
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <LegacyCard className="bg-[rgb(230_230_230/0.4)]">
          <h2 className={cn(headingFont, "mb-2 text-[24px] font-semibold")}>{restricted.title}</h2>
          <p className="mb-[18px]">{restricted.body}</p>
          <div className="flex flex-wrap gap-3">
            {restricted.actions.map((action) => (
              <Link key={action.href} href={action.href} className={action.primary ? legacyButton : legacyButtonSecondary}>
                {action.label}
              </Link>
            ))}
          </div>
        </LegacyCard>
      </Section>
    </LegacyPage>
  );
}
