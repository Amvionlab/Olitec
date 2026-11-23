"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Play, Newspaper, Share2, Plus, Sparkles, Video, Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface MediaItem {
  id: string;
  type: "article" | "video" | "social";
  title: string;
  source: string;
  date: string;
  url: string;
  excerpt: string;
  badge: string;
}

const INITIAL_MEDIA: MediaItem[] = [
  {
    id: "m1",
    type: "article",
    title: "Olitec Unveils Next-Gen Hybrid Inverters & LFP Storage Systems in Tamil Nadu",
    source: "Clean Energy India",
    date: "November 2026",
    url: "https://www.linkedin.com/company/olitec",
    excerpt: "Olitec's new manufacturing facility in Katpadi, Vellore begins delivery of indigenous single-phase and three-phase hybrid inverters engineered for Indian grid resilience.",
    badge: "Industry Feature",
  },
  {
    id: "m2",
    type: "video",
    title: "Inside Olitec's R&D Facility: Powering 24/7 Clean Energy with LFP Batteries",
    source: "YouTube",
    date: "October 2026",
    url: "https://www.youtube.com",
    excerpt: "Take an exclusive walkthrough of our state-of-the-art power electronics testing and passive convection thermal validation labs.",
    badge: "Video Tour",
  },
  {
    id: "m3",
    type: "social",
    title: "Why Indian Commercial Installations Require Unbalanced Three-Phase Inverters",
    source: "LinkedIn Post",
    date: "October 2026",
    url: "https://www.linkedin.com/company/olitec",
    excerpt: "Real-world commercial sites rarely have equal loads across R, Y, and B phases. Our OLI-3H series supports up to 100% phase imbalance safely.",
    badge: "Technical Note",
  },
  {
    id: "m4",
    type: "article",
    title: "Empowering Distributed Solar: How Olitec is Solving Peak Load Challenges",
    source: "Renewable Tech Review",
    date: "September 2026",
    url: "https://www.linkedin.com/company/olitec",
    excerpt: "With built-in peak shaving and smart time-of-use scheduling, Olitec inverters reduce grid strain while ensuring uninterrupted hospital and factory uptime.",
    badge: "Press Release",
  },
  {
    id: "m5",
    type: "social",
    title: "From Butterfly Appliances Heritage to Modern Clean Tech Manufacturing",
    source: "Instagram",
    date: "August 2026",
    url: "https://www.instagram.com",
    excerpt: "Four decades of precision manufacturing excellence now channelled into creating India's most dependable solar and energy storage hardware.",
    badge: "Company Story",
  },
  {
    id: "m6",
    type: "video",
    title: "Hybrid Inverter vs Traditional UPS: Understanding The Difference",
    source: "YouTube",
    date: "July 2026",
    url: "https://www.youtube.com",
    excerpt: "A 5-minute technical guide explaining sub-10ms switchover, solar priority routing, and lithium battery management.",
    badge: "Explainer Video",
  },
];

export function MediaPageClient() {
  const [items, setItems] = useState<MediaItem[]>(INITIAL_MEDIA);
  const [filter, setFilter] = useState<"all" | "article" | "video" | "social">("all");

  // Admin Quick Paste Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteSource, setPasteSource] = useState("");
  const [pasteType, setPasteType] = useState<"article" | "video" | "social">("article");
  const [addedSuccess, setAddedSuccess] = useState(false);

  const filteredItems = items.filter((item) => filter === "all" || item.type === filter);

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteUrl || !pasteTitle) return;

    const newItem: MediaItem = {
      id: `m_${Date.now()}`,
      type: pasteType,
      title: pasteTitle,
      source: pasteSource || "Web Article",
      date: "Just added",
      url: pasteUrl,
      excerpt: "Added by Olitec editorial team.",
      badge: pasteType === "video" ? "Video" : pasteType === "social" ? "Social Update" : "Article",
    };

    setItems([newItem, ...items]);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      setShowAddModal(false);
      setPasteUrl("");
      setPasteTitle("");
      setPasteSource("");
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-10">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#E6E2D8] pb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#C46E0E]">
            News & Editorial
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#161E2C] tracking-tight">
            Olitec Media & Updates
          </h1>
          <p className="mt-2 max-w-2xl text-base text-[#3C424C]">
            Explore our latest articles, press releases, technical insights, and video demonstrations of Olitec hybrid inverters and LFP storage.
          </p>
        </div>

        {/* Admin Link Addition Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-[#E6E2D8] bg-[#FFF7EA] px-4 py-2 text-xs font-bold text-[#161E2C] hover:bg-[#FFDDAA] transition shadow-2xs cursor-pointer"
        >
          <Plus className="size-3.5 text-[#C46E0E]" />
          <span>Add Media Link</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(
          [
            { id: "all", label: "All Content" },
            { id: "article", label: "Articles & Press" },
            { id: "video", label: "Videos" },
            { id: "social", label: "Social Updates" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "rounded-full px-5 py-2 text-xs font-bold transition cursor-pointer",
              filter === tab.id
                ? "bg-[#161E2C] text-white shadow-xs"
                : "bg-slate-100 text-[#3C424C] hover:bg-slate-200",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Media Cards Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <article
            key={item.id}
            className="flex flex-col justify-between rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-xs transition hover:border-[#E8962C] hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span className="rounded-full bg-[#FFF7EA] px-3 py-1 font-bold text-[#C46E0E] border border-[#FFDDAA]">
                  {item.badge}
                </span>
                <span>{item.date}</span>
              </div>

              <h2 className="mt-4 text-lg font-bold text-[#161E2C] leading-snug line-clamp-2">
                {item.title}
              </h2>

              <p className="mt-3 text-xs leading-relaxed text-[#3C424C] line-clamp-3">
                {item.excerpt}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B7280]">
                {item.source}
              </span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#C46E0E] hover:underline"
              >
                <span>Read / Watch</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </article>
        ))}
      </div>

      {/* Admin Link Entry Modal (Item 5) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-white bg-[#FFFAF2] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#161E2C]">Add New Media Link</h3>
            <p className="mt-1 text-xs text-[#6B7280]">
              Paste a URL from LinkedIn, Instagram, YouTube, or an external news article to display on the Media page.
            </p>

            <form onSubmit={handleAddLink} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#161E2C] mb-1">
                  Content Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["article", "video", "social"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPasteType(t)}
                      className={cn(
                        "rounded-xl py-2 text-xs font-bold capitalize transition",
                        pasteType === t
                          ? "bg-[#161E2C] text-white"
                          : "bg-white border border-[#E6E2D8] text-[#3C424C]",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#161E2C] mb-1">
                  Title / Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Olitec Inverter Feature in Power Magazine"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#E6E2D8] bg-white px-3.5 py-2.5 text-xs text-[#161E2C] focus:outline-none focus:border-[#E8962C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#161E2C] mb-1">
                  Web URL Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={pasteUrl}
                  onChange={(e) => setPasteUrl(e.target.value)}
                  className="w-full rounded-xl border border-[#E6E2D8] bg-white px-3.5 py-2.5 text-xs text-[#161E2C] focus:outline-none focus:border-[#E8962C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#161E2C] mb-1">
                  Source / Publisher Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. LinkedIn, YouTube, The Hindu"
                  value={pasteSource}
                  onChange={(e) => setPasteSource(e.target.value)}
                  className="w-full rounded-xl border border-[#E6E2D8] bg-white px-3.5 py-2.5 text-xs text-[#161E2C] focus:outline-none focus:border-[#E8962C]"
                />
              </div>

              {addedSuccess ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-100 p-2.5 text-xs font-bold text-emerald-800">
                  <Check className="size-4" />
                  <span>Media item added successfully!</span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-[#6B7280] hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] px-5 py-2 text-xs font-bold text-[#161E2C] shadow-sm hover:brightness-105"
                  >
                    Publish to Media Page
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
