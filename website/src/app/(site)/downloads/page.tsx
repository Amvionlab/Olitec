/** Downloads — datasheets and brochures. */
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
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-10 pb-2 sm:px-8 xl:px-12">
        <h1 className="text-3xl font-bold tracking-tight text-[#161E2C] sm:text-4xl">
          Downloads
        </h1>
        <p className="mt-2 text-base font-medium text-[#2A323F]">
          {downloadsPage.lead}
        </p>
      </div>

      <Section innerClassName="pt-6">
        {/* PDF Datasheets & Brochures */}
        {groups.map((group) => (
          <div key={group.title} className="reveal-on-scroll">
            <h2 className={cn(headingFont, "mb-3 text-[26px] font-semibold text-[#161E2C]")}>{group.title}</h2>
            <ul className="mb-12 border-b border-[#e6e6e6]">
              {group.files.map((file) => (
                <li key={file.href} className="group flex flex-wrap items-center gap-[18px] border-t border-[#e6e6e6] py-[22px] px-3 -mx-3 rounded-2xl transition-all duration-300 ease-out hover:bg-slate-50">
                  <IconTile icon="file" size={52} tone="orange" />
                  <div className="min-w-0 flex-[1_1_360px]">
                    <div className="text-[19px] font-semibold text-[#161E2C] transition-colors duration-300 group-hover:text-brand-700">{file.title}</div>
                    <div className="text-[15px] text-muted">{file.description}</div>
                  </div>
                  <span className="flex-none text-sm text-muted">{file.size}</span>
                  <a
                    className="brand-gradient inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-xs font-bold text-black shadow-sm transition hover:brightness-105 active:scale-95"
                    href={file.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${file.title} (PDF, opens in a new tab)`}
                  >
                    <LegacyIcon name="download" size={16} strokeWidth={2.5} />
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="reveal-on-scroll">
          <div className="rounded-[28px] bg-[#161E2C] p-8 text-white sm:p-10 shadow-lg">
            <h2 className={cn(headingFont, "mb-2 text-[24px] font-semibold text-white")}>{restricted.title}</h2>
            <p className="mb-6 max-w-2xl text-white/80 text-[15px] leading-relaxed">{restricted.body}</p>
            <div className="flex flex-wrap gap-3">
              {restricted.actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="brand-gradient inline-flex h-11 items-center justify-center rounded-full px-6 text-xs font-bold text-black transition hover:brightness-105 shadow-sm"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </LegacyPage>
  );
}
