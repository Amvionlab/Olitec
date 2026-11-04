"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { useEcom } from "@/components/ecommerce/EcomSession";
import { Field, ImageUpload, LoadState, Modal, Pill, RequirePermission, Thumb, inputClass, useAction, useApi } from "@/components/ecommerce/kit";
import { ecomApi } from "@/services/ecommerce/api";

interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount: number;
}

interface Brand {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  productCount: number;
}

type Draft = { id?: number; parentId: string; name: string; slug: string; description: string; imageUrl: string; isActive: boolean; seoTitle: string; seoDescription: string };

function CategoriesContent() {
  const { can } = useEcom();
  const editable = can("categories.manage");
  const categories = useApi<Category[]>("/admin/categories");
  const brands = useApi<Brand[]>("/admin/brands");
  const { run, busy } = useAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [brandDraft, setBrandDraft] = useState<{ id?: number; name: string; isActive: boolean } | null>(null);

  const list = categories.data ?? [];
  const roots = list.filter((category) => !category.parentId).sort((a, b) => a.displayOrder - b.displayOrder);
  const childrenOf = (id: number) => list.filter((category) => category.parentId === id).sort((a, b) => a.displayOrder - b.displayOrder);

  const openEditor = (category?: Category, parentId?: number) =>
    setDraft(
      category
        ? { id: category.id, parentId: category.parentId ? String(category.parentId) : "", name: category.name, slug: category.slug, description: category.description ?? "", imageUrl: category.imageUrl ?? "", isActive: category.isActive, seoTitle: category.seoTitle ?? "", seoDescription: category.seoDescription ?? "" }
        : { parentId: parentId ? String(parentId) : "", name: "", slug: "", description: "", imageUrl: "", isActive: true, seoTitle: "", seoDescription: "" },
    );

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const body = {
      parentId: draft.parentId ? Number(draft.parentId) : null,
      name: draft.name.trim(),
      ...(draft.slug ? { slug: draft.slug } : {}),
      description: draft.description,
      imageUrl: draft.imageUrl,
      isActive: draft.isActive,
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
      ...(draft.id ? {} : { displayOrder: (draft.parentId ? childrenOf(Number(draft.parentId)) : roots).length + 1 }),
    };
    const ok = await run(() => (draft.id ? ecomApi.patch(`/admin/categories/${draft.id}`, body) : ecomApi.post("/admin/categories", body)), "Category saved");
    if (ok !== undefined) {
      setDraft(null);
      categories.reload();
    }
  };

  const move = async (siblings: Category[], index: number, delta: number) => {
    const reordered = [...siblings];
    const [item] = reordered.splice(index, 1);
    reordered.splice(index + delta, 0, item);
    await run(() => ecomApi.post("/admin/categories/reorder", { order: reordered.map((category, position) => ({ id: category.id, displayOrder: position + 1 })) }));
    categories.reload();
  };

  const toggle = async (category: Category) => {
    await run(() => ecomApi.patch(`/admin/categories/${category.id}`, { isActive: !category.isActive }), category.isActive ? "Category hidden from the shop" : "Category is visible on the shop");
    categories.reload();
  };

  const remove = async () => {
    if (!deleting) return;
    const ok = await run(() => ecomApi.delete(`/admin/categories/${deleting.id}`), "Category deleted");
    setDeleting(null);
    if (ok !== undefined) categories.reload();
  };

  const saveBrand = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!brandDraft) return;
    const body = { name: brandDraft.name.trim(), isActive: brandDraft.isActive };
    const ok = await run(() => (brandDraft.id ? ecomApi.patch(`/admin/brands/${brandDraft.id}`, body) : ecomApi.post("/admin/brands", body)), "Brand saved");
    if (ok !== undefined) {
      setBrandDraft(null);
      brands.reload();
    }
  };

  const row = (category: Category, siblings: Category[], index: number, depth: number) => (
    <li key={category.id}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50" style={{ paddingLeft: `${16 + depth * 28}px` }}>
        <Thumb src={category.imageUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">
            {category.name} {!category.isActive && <Pill>Hidden</Pill>}
          </p>
          <p className="text-xs text-slate-500">/{category.slug} · {category.productCount} active products</p>
        </div>
        {editable && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={index === 0 || busy} onClick={() => void move(siblings, index, -1)} aria-label={`Move ${category.name} up`}><ArrowUp className="size-4" /></Button>
            <Button variant="ghost" size="sm" disabled={index === siblings.length - 1 || busy} onClick={() => void move(siblings, index, 1)} aria-label={`Move ${category.name} down`}><ArrowDown className="size-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => void toggle(category)}>{category.isActive ? "Deactivate" : "Activate"}</Button>
            {depth === 0 && <Button variant="ghost" size="sm" onClick={() => openEditor(undefined, category.id)} aria-label={`Add subcategory to ${category.name}`}><Plus className="size-4" /></Button>}
            <Button variant="ghost" size="sm" onClick={() => openEditor(category)} aria-label={`Edit ${category.name}`}><Pencil className="size-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(category)} aria-label={`Delete ${category.name}`}><Trash2 className="size-4 text-red-600" /></Button>
          </div>
        )}
      </div>
      {childrenOf(category.id).length > 0 && <ul>{childrenOf(category.id).map((child, childIndex, childList) => row(child, childList, childIndex, depth + 1))}</ul>}
    </li>
  );

  return (
    <>
      <PageHeader title="Categories & brands" description="The category tree drives the shop menu, filters and URLs." actions={editable && <Button onClick={() => openEditor()}><Plus className="size-4" aria-hidden /> Add category</Button>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader title="Category tree" />
          <LoadState loading={categories.loading} error={categories.error} empty={!categories.data}>
            {roots.length === 0 ? <p className="p-6 text-sm text-slate-500">No categories yet.</p> : <ul className="divide-y divide-slate-100">{roots.map((category, index) => row(category, roots, index, 0))}</ul>}
          </LoadState>
        </Card>
        <Card>
          <CardHeader title="Brands" action={can("products.manage") && <Button size="sm" variant="secondary" onClick={() => setBrandDraft({ name: "", isActive: true })}><Plus className="size-4" aria-hidden /> Add</Button>} />
          <LoadState loading={brands.loading} error={brands.error} empty={!brands.data}>
            <ul className="divide-y divide-slate-100">
              {brands.data?.map((brand) => (
                <li key={brand.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span>
                    <span className="font-medium text-slate-900">{brand.name}</span> {!brand.isActive && <Pill>Inactive</Pill>}
                    <span className="block text-xs text-slate-500">{brand.productCount} products</span>
                  </span>
                  {can("products.manage") && <Button variant="ghost" size="sm" onClick={() => setBrandDraft({ id: brand.id, name: brand.name, isActive: brand.isActive })} aria-label={`Edit ${brand.name}`}><Pencil className="size-4" /></Button>}
                </li>
              ))}
              {brands.data?.length === 0 && <li className="p-4 text-sm text-slate-500">No brands yet.</li>}
            </ul>
          </LoadState>
        </Card>
      </div>

      <Modal open={draft !== null} title={draft?.id ? "Edit category" : "New category"} onClose={() => setDraft(null)} wide>
        {draft && (
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <Field label="Name *"><input className={inputClass} required minLength={2} maxLength={100} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
            <Field label="Slug" hint="Leave empty to generate from the name"><input className={inputClass} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></Field>
            <Field label="Parent category">
              <select className={inputClass} value={draft.parentId} onChange={(event) => setDraft({ ...draft, parentId: event.target.value })}>
                <option value="">None (top level)</option>
                {list.filter((category) => category.id !== draft.id).map((category) => <option key={category.id} value={category.id}>{category.parentId ? "— " : ""}{category.name}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" className="size-4 accent-brand-600" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Visible on the shop
            </label>
            <div className="md:col-span-2"><Field label="Description"><textarea className={`${inputClass} min-h-20`} maxLength={1000} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field></div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Thumb src={draft.imageUrl} />
              <ImageUpload label={draft.imageUrl ? "Replace image" : "Upload image"} onUploaded={(url) => setDraft((current) => current && { ...current, imageUrl: url })} />
              {draft.imageUrl && <Button variant="ghost" size="sm" onClick={() => setDraft({ ...draft, imageUrl: "" })}>Remove</Button>}
            </div>
            <Field label="SEO title"><input className={inputClass} maxLength={160} value={draft.seoTitle} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} /></Field>
            <Field label="Meta description"><input className={inputClass} maxLength={320} value={draft.seoDescription} onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })} /></Field>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save category</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={brandDraft !== null} title={brandDraft?.id ? "Edit brand" : "New brand"} onClose={() => setBrandDraft(null)}>
        {brandDraft && (
          <form onSubmit={saveBrand} className="space-y-4">
            <Field label="Brand name *"><input className={inputClass} required maxLength={100} value={brandDraft.name} onChange={(event) => setBrandDraft({ ...brandDraft, name: event.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-brand-600" checked={brandDraft.isActive} onChange={(event) => setBrandDraft({ ...brandDraft, isActive: event.target.checked })} /> Active</label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setBrandDraft(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save brand</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete “${deleting?.name}”?`}
        description="Only empty categories (no products, no subcategories) can be deleted. To hide a category with products, deactivate it instead."
        confirmLabel="Delete category"
        tone="danger"
        loading={busy}
        onConfirm={() => void remove()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

export default function CategoriesPage() {
  return (
    <RequirePermission permission="products.view">
      <CategoriesContent />
    </RequirePermission>
  );
}
