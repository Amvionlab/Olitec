"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, ImageUpload, LoadState, Modal, Pill, RequirePermission, Thumb, inputClass, useAction, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { formatDateTime } from "@/lib/format";
import { ecomApi } from "@/services/ecommerce/api";

type BlockType = "banner" | "promo" | "testimonial" | "faq" | "trust_badge";

interface Block {
  id: number;
  blockType: BlockType;
  title: string;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  authorName: string | null;
  displayOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

interface Page {
  id: number;
  slug: string;
  title: string;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  updatedBy: string | null;
  updatedAt: string;
}

const TABS: { key: BlockType | "pages"; label: string; help: string }[] = [
  { key: "banner", label: "Banners", help: "Homepage carousel. Title, subtitle, image and a button link." },
  { key: "promo", label: "Promotions", help: "Campaign tiles below the featured products." },
  { key: "testimonial", label: "Testimonials", help: "Publish only genuine testimonials you have permission to use." },
  { key: "faq", label: "FAQs", help: "Shown on the homepage and the FAQ page. Title = question, body = answer." },
  { key: "trust_badge", label: "Trust badges", help: "Short benefit statements under the banner. Without any, neutral platform facts are shown." },
  { key: "pages", label: "Policy pages", help: "About, shipping, returns, privacy, terms and warranty pages. Publish only business-approved text." },
];

const toLocal = (value: string | null) => (value ? new Date(new Date(value).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

function Blocks({ type }: { type: BlockType }) {
  const { data, error, loading, reload } = useApi<Block[]>(`/admin/content?type=${type}`);
  const { run, busy } = useAction();
  const [draft, setDraft] = useState<(Omit<Block, "id" | "startsAt" | "endsAt"> & { id?: number; startsAt: string; endsAt: string }) | null>(null);
  const [deleting, setDeleting] = useState<Block | null>(null);

  const edit = (block?: Block) =>
    setDraft(
      block
        ? { ...block, startsAt: toLocal(block.startsAt), endsAt: toLocal(block.endsAt) }
        : { blockType: type, title: "", subtitle: "", body: "", imageUrl: "", linkUrl: "", linkLabel: "", authorName: "", displayOrder: (data?.length ?? 0) + 1, isActive: false, startsAt: "", endsAt: "" },
    );

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const { id, ...rest } = draft;
    const body = {
      ...rest,
      subtitle: rest.subtitle || null,
      body: rest.body || null,
      imageUrl: rest.imageUrl || null,
      linkUrl: rest.linkUrl || null,
      linkLabel: rest.linkLabel || null,
      authorName: rest.authorName || null,
      startsAt: rest.startsAt ? new Date(rest.startsAt).toISOString() : null,
      endsAt: rest.endsAt ? new Date(rest.endsAt).toISOString() : null,
    };
    const ok = await run(() => (id ? ecomApi.patch(`/admin/content/${id}`, body) : ecomApi.post("/admin/content", body)), "Saved — the shop updates within a minute");
    if (ok) { setDraft(null); reload(); }
  };

  const toggle = async (block: Block) => {
    await run(() => ecomApi.patch(`/admin/content/${block.id}`, { isActive: !block.isActive }), block.isActive ? "Unpublished" : "Published");
    reload();
  };

  const showImage = type === "banner" || type === "promo";
  const showLink = type === "banner" || type === "promo";
  return (
    <Card>
      <div className="flex justify-end border-b border-slate-100 p-4"><Button size="sm" onClick={() => edit()}><Plus className="size-4" aria-hidden /> Add</Button></div>
      <LoadState loading={loading} error={error} empty={!data}>
        {data?.length === 0 ? <p className="p-6 text-sm text-slate-500">Nothing here yet.</p> : (
          <ul className="divide-y divide-slate-100">
            {data?.map((block) => (
              <li key={block.id} className="flex items-center gap-3 px-5 py-3">
                {showImage && <Thumb src={block.imageUrl} />}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-slate-900">{block.title} {block.isActive ? <Pill tone="green">Published</Pill> : <Pill>Draft</Pill>}</p>
                  <p className="truncate text-xs text-slate-500">#{block.displayOrder} · {block.subtitle ?? block.body ?? ""}{(block.startsAt || block.endsAt) && ` · ${block.startsAt ? formatDateTime(block.startsAt) : "now"} → ${block.endsAt ? formatDateTime(block.endsAt) : "no end"}`}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void toggle(block)}>{block.isActive ? "Unpublish" : "Publish"}</Button>
                <Button variant="ghost" size="sm" onClick={() => edit(block)} aria-label={`Edit ${block.title}`}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(block)} aria-label={`Delete ${block.title}`}><Trash2 className="size-4 text-red-600" /></Button>
              </li>
            ))}
          </ul>
        )}
      </LoadState>

      <Modal open={draft !== null} title={draft?.id ? "Edit content" : "New content"} onClose={() => setDraft(null)} wide>
        {draft && (
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><Field label={type === "faq" ? "Question *" : "Title *"}><input className={inputClass} required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></Field></div>
            {type !== "faq" && <div className="md:col-span-2"><Field label={type === "testimonial" ? "Customer location / role" : "Subtitle"}><input className={inputClass} maxLength={300} value={draft.subtitle ?? ""} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} /></Field></div>}
            {(type === "faq" || type === "testimonial" || type === "promo") && <div className="md:col-span-2"><Field label={type === "faq" ? "Answer *" : type === "testimonial" ? "Testimonial text *" : "Body"}><textarea className={`${inputClass} min-h-28`} required={type !== "promo"} maxLength={5000} value={draft.body ?? ""} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></Field></div>}
            {type === "testimonial" && <Field label="Customer name *"><input className={inputClass} required maxLength={100} value={draft.authorName ?? ""} onChange={(event) => setDraft({ ...draft, authorName: event.target.value })} /></Field>}
            {showImage && (
              <div className="flex items-center gap-3 md:col-span-2">
                <Thumb src={draft.imageUrl} />
                <ImageUpload label={draft.imageUrl ? "Replace image" : "Upload image"} onUploaded={(url) => setDraft((current) => current && { ...current, imageUrl: url })} />
                {type === "banner" && <span className="text-xs text-slate-500">Wide images (about 1600 × 600) work best.</span>}
              </div>
            )}
            {showLink && (
              <>
                <Field label="Button link" hint="Shop path like /categories/solar-panels, or https://…"><input className={inputClass} pattern="(https?://|/).*" maxLength={512} value={draft.linkUrl ?? ""} onChange={(event) => setDraft({ ...draft, linkUrl: event.target.value })} /></Field>
                <Field label="Button text"><input className={inputClass} maxLength={60} value={draft.linkLabel ?? ""} onChange={(event) => setDraft({ ...draft, linkLabel: event.target.value })} /></Field>
              </>
            )}
            <Field label="Display order"><input className={inputClass} type="number" value={draft.displayOrder} onChange={(event) => setDraft({ ...draft, displayOrder: Number(event.target.value) })} /></Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Published</label>
            {(type === "banner" || type === "promo") && (
              <>
                <Field label="Show from" hint="Optional schedule"><input className={inputClass} type="datetime-local" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} /></Field>
                <Field label="Show until"><input className={inputClass} type="datetime-local" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} /></Field>
              </>
            )}
            <div className="flex justify-end gap-2 md:col-span-2"><Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" loading={busy}>Save</Button></div>
          </form>
        )}
      </Modal>
      <ConfirmDialog open={deleting !== null} title={`Delete “${deleting?.title}”?`} description="This removes it from the shop permanently. Unpublish it instead if you may need it again." confirmLabel="Delete" tone="danger" loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => { await run(() => ecomApi.delete(`/admin/content/${deleting!.id}`), "Deleted"); setDeleting(null); reload(); }} />
    </Card>
  );
}

function Pages() {
  const { data, error, loading, reload } = useApi<Page[]>("/admin/pages");
  const { run, busy } = useAction();
  const [draft, setDraft] = useState<Page | null>(null);
  const [creating, setCreating] = useState(false);
  return (
    <Card>
      <div className="flex justify-end border-b border-slate-100 p-4"><Button size="sm" onClick={() => { setCreating(true); setDraft({ id: 0, slug: "", title: "", body: "", seoTitle: "", seoDescription: "", isPublished: false, updatedBy: null, updatedAt: "" }); }}><Plus className="size-4" aria-hidden /> New page</Button></div>
      <LoadState loading={loading} error={error} empty={!data}>
        <ul className="divide-y divide-slate-100">
          {data?.map((page) => (
            <li key={page.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span>
                <span className="font-medium text-slate-900">{page.title}</span> {page.isPublished ? <Pill tone="green">Published</Pill> : <Pill tone="amber">Not published</Pill>}
                <span className="block text-xs text-slate-500">/policies/{page.slug} · updated {formatDateTime(page.updatedAt)}{page.updatedBy && ` by ${page.updatedBy}`}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => { setCreating(false); setDraft(page); }} aria-label={`Edit ${page.title}`}><Pencil className="size-4" /></Button>
            </li>
          ))}
        </ul>
      </LoadState>
      <Modal open={draft !== null} title={creating ? "New page" : `Edit ${draft?.title ?? ""}`} onClose={() => setDraft(null)} wide>
        {draft && (
          <form className="space-y-4" onSubmit={async (event) => {
            event.preventDefault();
            const body = { title: draft.title, body: draft.body, seoTitle: draft.seoTitle || null, seoDescription: draft.seoDescription || null, isPublished: draft.isPublished };
            const ok = await run(() => (creating ? ecomApi.post("/admin/pages", { ...body, slug: draft.slug }) : ecomApi.patch(`/admin/pages/${draft.id}`, body)), "Page saved");
            if (ok) { setDraft(null); reload(); }
          }}>
            <Alert tone="warning">Policy text is a business and legal commitment. Publish only text approved by the business.</Alert>
            {creating && <Field label="URL slug *" hint="e.g. installation-policy"><input className={inputClass} required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></Field>}
            <Field label="Title *"><input className={inputClass} required minLength={2} maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></Field>
            <Field label="Content *" hint="Plain text. Leave a blank line between paragraphs."><textarea className={`${inputClass} min-h-72 font-mono text-[13px]`} required maxLength={100000} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="SEO title"><input className={inputClass} maxLength={160} value={draft.seoTitle ?? ""} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} /></Field>
              <Field label="Meta description"><input className={inputClass} maxLength={320} value={draft.seoDescription ?? ""} onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={draft.isPublished} onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })} /> Published (visible on the shop and linked in the footer)</label>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" loading={busy}>Save page</Button></div>
          </form>
        )}
      </Modal>
    </Card>
  );
}

function ContentManager() {
  const { get, set } = useUrlFilters();
  const tab = (get("tab") || "banner") as (typeof TABS)[number]["key"];
  const current = TABS.find((item) => item.key === tab) ?? TABS[0];
  return (
    <>
      <PageHeader title="Website content" description="Changes appear on the shop within about a minute — no deployment needed." />
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {TABS.map((item) => (
          <button key={item.key} role="tab" aria-selected={tab === item.key} onClick={() => set({ tab: item.key === "banner" ? null : item.key })} className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-medium ${tab === item.key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{item.label}</button>
        ))}
      </div>
      <p className="mb-4 text-sm text-slate-500">
        {current.help} Featured, best-selling, new and offer products are chosen with the flags on each <Link href="/ecommerce/products" className="text-brand-700 hover:underline">product</Link>; category order is set in <Link href="/ecommerce/categories" className="text-brand-700 hover:underline">Categories</Link>.
      </p>
      {tab === "pages" ? <Pages /> : <Blocks key={tab} type={tab} />}
    </>
  );
}

export default function ContentPage() {
  return (
    <RequirePermission permission="content.manage">
      <Suspense>
        <ContentManager />
      </Suspense>
    </RequirePermission>
  );
}
