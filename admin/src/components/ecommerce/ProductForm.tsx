"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useEcom } from "./EcomSession";
import { Field, ImageUpload, inputClass, useAction, useApi } from "./kit";
import { ecomApi, messageOf } from "@/services/ecommerce/api";

export interface AdminProduct {
  id: number;
  slug: string;
  sku: string;
  name: string;
  category: { id: number };
  brand: { id: number } | null;
  variantOfId: number | null;
  attributes: Record<string, string>;
  shortDescription: string | null;
  description: string | null;
  features: string[];
  specifications: { label: string; value: string }[];
  mrp: number;
  sellingPrice: number;
  taxRate: number;
  hsnCode: string | null;
  warrantyInfo: string | null;
  deliveryInfo: string | null;
  stockQty: number;
  reservedQty: number;
  lowStockThreshold: number;
  maxOrderQty: number;
  status: "draft" | "active" | "inactive" | "archived";
  seoTitle: string | null;
  seoDescription: string | null;
  flags: { featured: boolean; bestSeller: boolean; newArrival: boolean; onOffer: boolean };
  images: { url: string; alt: string | null }[];
}

const SHOP_URL = (process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3002").replace(/\/$/, "");

type Form = {
  sku: string;
  slug: string;
  name: string;
  categoryId: string;
  brandId: string;
  variantOfId: string;
  attributes: { key: string; value: string }[];
  shortDescription: string;
  description: string;
  features: string[];
  specifications: { label: string; value: string }[];
  mrp: string;
  sellingPrice: string;
  taxRate: string;
  hsnCode: string;
  warrantyInfo: string;
  deliveryInfo: string;
  initialStock: string;
  lowStockThreshold: string;
  maxOrderQty: string;
  status: AdminProduct["status"];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isOnOffer: boolean;
  seoTitle: string;
  seoDescription: string;
  images: { url: string; alt: string }[];
};

function toForm(product?: AdminProduct): Form {
  return {
    sku: product?.sku ?? "",
    slug: product?.slug ?? "",
    name: product?.name ?? "",
    categoryId: product ? String(product.category.id) : "",
    brandId: product?.brand ? String(product.brand.id) : "",
    variantOfId: product?.variantOfId ? String(product.variantOfId) : "",
    attributes: Object.entries(product?.attributes ?? {}).map(([key, value]) => ({ key, value })),
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    features: product?.features ?? [],
    specifications: product?.specifications ?? [],
    mrp: product ? String(product.mrp) : "",
    sellingPrice: product ? String(product.sellingPrice) : "",
    taxRate: product ? String(product.taxRate) : "18",
    hsnCode: product?.hsnCode ?? "",
    warrantyInfo: product?.warrantyInfo ?? "",
    deliveryInfo: product?.deliveryInfo ?? "",
    initialStock: "0",
    lowStockThreshold: product ? String(product.lowStockThreshold) : "5",
    maxOrderQty: product ? String(product.maxOrderQty) : "10",
    status: product?.status ?? "draft",
    isFeatured: product?.flags.featured ?? false,
    isBestSeller: product?.flags.bestSeller ?? false,
    isNewArrival: product?.flags.newArrival ?? false,
    isOnOffer: product?.flags.onOffer ?? false,
    seoTitle: product?.seoTitle ?? "",
    seoDescription: product?.seoDescription ?? "",
    images: product?.images.map((image) => ({ url: image.url, alt: image.alt ?? "" })) ?? [],
  };
}

/** Create/edit form for a product. All rules (unique SKU, price ≤ MRP, image URLs) are enforced again by the API. */
export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const { can, notify } = useEcom();
  const editable = can("products.manage");
  const [form, setForm] = useState<Form>(() => toForm(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { run, busy } = useAction();
  const { data: categories } = useApi<{ id: number; name: string; parentId: number | null }[]>("/admin/categories");
  const { data: brands } = useApi<{ id: number; name: string }[]>("/admin/brands");

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));
  const text = (key: keyof Form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(key, event.target.value as never);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/.test(form.sku)) next.sku = "2–64 letters, numbers, dots, dashes or underscores.";
    if (form.name.trim().length < 2) next.name = "Enter the product name.";
    if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) next.slug = "Lowercase letters, numbers and single dashes only.";
    if (!form.categoryId) next.categoryId = "Choose a category.";
    const mrp = Number(form.mrp);
    const price = Number(form.sellingPrice);
    if (!(mrp > 0)) next.mrp = "Enter the MRP.";
    if (!(price > 0)) next.sellingPrice = "Enter the selling price.";
    if (mrp > 0 && price > mrp) next.sellingPrice = "Selling price cannot exceed MRP.";
    if (form.specifications.some((spec) => !spec.label.trim() || !spec.value.trim())) next.specifications = "Fill in or remove empty specification rows.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);
    if (!validate()) return setServerError("Please fix the highlighted fields.");
    setSaving(true);
    const body = {
      sku: form.sku.trim(),
      ...(form.slug ? { slug: form.slug } : {}),
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      brandId: form.brandId ? Number(form.brandId) : null,
      variantOfId: form.variantOfId ? Number(form.variantOfId) : null,
      attributes: Object.fromEntries(form.attributes.filter((item) => item.key.trim()).map((item) => [item.key.trim(), item.value.trim()])),
      shortDescription: form.shortDescription,
      description: form.description,
      features: form.features.map((feature) => feature.trim()).filter(Boolean),
      specifications: form.specifications.map((spec) => ({ label: spec.label.trim(), value: spec.value.trim() })),
      mrp: Number(form.mrp),
      sellingPrice: Number(form.sellingPrice),
      taxRate: Number(form.taxRate),
      hsnCode: form.hsnCode,
      warrantyInfo: form.warrantyInfo,
      deliveryInfo: form.deliveryInfo,
      lowStockThreshold: Number(form.lowStockThreshold),
      maxOrderQty: Number(form.maxOrderQty),
      status: form.status,
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      isNewArrival: form.isNewArrival,
      isOnOffer: form.isOnOffer,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      images: form.images.map((image) => ({ url: image.url, ...(image.alt ? { alt: image.alt } : {}) })),
      ...(product ? {} : { initialStock: Number(form.initialStock) || 0 }),
    };
    try {
      const saved = product ? await ecomApi.patch<AdminProduct>(`/admin/products/${product.id}`, body) : await ecomApi.post<AdminProduct>("/admin/products", body);
      notify(product ? "Product saved" : "Product created");
      if (!product) router.replace(`/ecommerce/products/${saved.id}`);
      else setForm(toForm(saved));
    } catch (error) {
      setServerError(messageOf(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const ok = await run(() => ecomApi.delete(`/admin/products/${product!.id}`), "Product deleted");
    setConfirmDelete(false);
    if (ok !== undefined) router.replace("/ecommerce/products");
  };

  const moveImage = (index: number, delta: number) => {
    const images = [...form.images];
    const [item] = images.splice(index, 1);
    images.splice(index + delta, 0, item);
    set("images", images);
  };

  const err = (key: string) => errors[key] && <p className="text-xs text-red-600">{errors[key]}</p>;

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      {serverError && <Alert tone="error">{serverError}</Alert>}
      {!editable && <Alert tone="info">You can view this product but not change it.</Alert>}
      <fieldset disabled={!editable} className="space-y-6">
        <Card>
          <CardHeader title="Basics" />
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field label="Product name *"><input className={inputClass} value={form.name} onChange={text("name")} maxLength={200} />{err("name")}</Field>
            <Field label="SKU *" hint="Unique stock-keeping unit"><input className={inputClass} value={form.sku} onChange={text("sku")} maxLength={64} />{err("sku")}</Field>
            <Field label="URL slug" hint="Leave empty to generate from the name"><input className={inputClass} value={form.slug} onChange={text("slug")} maxLength={160} />{err("slug")}</Field>
            <Field label="Status">
              <select className={inputClass} value={form.status} onChange={text("status")}>
                <option value="draft">Draft (hidden)</option>
                <option value="active">Active (on sale)</option>
                <option value="inactive">Inactive (hidden)</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Category *">
              <select className={inputClass} value={form.categoryId} onChange={text("categoryId")}>
                <option value="">Choose…</option>
                {categories?.map((category) => <option key={category.id} value={category.id}>{category.parentId ? "— " : ""}{category.name}</option>)}
              </select>
              {err("categoryId")}
            </Field>
            <Field label="Brand">
              <select className={inputClass} value={form.brandId} onChange={text("brandId")}>
                <option value="">No brand</option>
                {brands?.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Short description" hint="Shown on product cards and in search results"><textarea className={`${inputClass} min-h-16`} value={form.shortDescription} onChange={text("shortDescription")} maxLength={500} /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Full description" hint="Plain text; blank lines start new paragraphs"><textarea className={`${inputClass} min-h-40`} value={form.description} onChange={text("description")} maxLength={20000} /></Field>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Pricing" description="Prices are GST-inclusive, as shown to customers." />
          <div className="grid gap-4 p-5 md:grid-cols-4">
            <Field label="MRP (₹) *"><input className={inputClass} inputMode="decimal" value={form.mrp} onChange={text("mrp")} />{err("mrp")}</Field>
            <Field label="Selling price (₹) *"><input className={inputClass} inputMode="decimal" value={form.sellingPrice} onChange={text("sellingPrice")} />{err("sellingPrice")}</Field>
            <Field label="GST rate (%)">
              <select className={inputClass} value={form.taxRate} onChange={text("taxRate")}>
                {["0", "5", "12", "18", "28"].map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
              </select>
            </Field>
            <Field label="HSN code"><input className={inputClass} value={form.hsnCode} onChange={text("hsnCode")} maxLength={16} /></Field>
            {Number(form.mrp) > 0 && Number(form.sellingPrice) > 0 && Number(form.sellingPrice) <= Number(form.mrp) && (
              <p className="text-sm text-slate-500 md:col-span-4">Discount shown: {Math.round(((Number(form.mrp) - Number(form.sellingPrice)) / Number(form.mrp)) * 100)}% off</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Stock and limits" description={product ? `On hand ${product.stockQty} · reserved ${product.reservedQty}. Change stock in Inventory.` : "Opening stock is recorded as a stock-in movement."} />
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {!product && <Field label="Opening stock"><input className={inputClass} inputMode="numeric" value={form.initialStock} onChange={text("initialStock")} /></Field>}
            <Field label="Low-stock alert at"><input className={inputClass} inputMode="numeric" value={form.lowStockThreshold} onChange={text("lowStockThreshold")} /></Field>
            <Field label="Max quantity per order"><input className={inputClass} inputMode="numeric" value={form.maxOrderQty} onChange={text("maxOrderQty")} /></Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Images" description="JPEG, PNG or WebP up to 5 MB. The first image is the main one." action={<ImageUpload multiple label="Upload images" onUploaded={(url) => setForm((current) => ({ ...current, images: [...current.images, { url, alt: "" }] }))} />} />
          <div className="p-5">
            {form.images.length === 0 ? (
              <p className="text-sm text-slate-500">No images yet.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {form.images.map((image, index) => (
                  <li key={image.url} className="space-y-2 rounded-xl border border-slate-200 p-3">
                    {/* Plain <img>: preview of an uploaded file on the API host. */}
                    <img src={image.url} alt={image.alt || `Image ${index + 1}`} className="h-40 w-full rounded-lg bg-slate-50 object-contain" />
                    <input className={inputClass} placeholder="Alt text (describe the image)" value={image.alt} maxLength={200} onChange={(event) => set("images", form.images.map((item, position) => (position === index ? { ...item, alt: event.target.value } : item)))} />
                    <div className="flex justify-between">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => moveImage(index, -1)} aria-label="Move earlier"><ArrowUp className="size-4" /></Button>
                        <Button variant="ghost" size="sm" disabled={index === form.images.length - 1} onClick={() => moveImage(index, 1)} aria-label="Move later"><ArrowDown className="size-4" /></Button>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => set("images", form.images.filter((_, position) => position !== index))} aria-label="Remove image"><Trash2 className="size-4 text-red-600" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Features and specifications" />
          <div className="grid gap-6 p-5 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Key features</p>
              {form.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input className={inputClass} value={feature} maxLength={300} onChange={(event) => set("features", form.features.map((item, position) => (position === index ? event.target.value : item)))} aria-label={`Feature ${index + 1}`} />
                  <Button variant="ghost" size="sm" onClick={() => set("features", form.features.filter((_, position) => position !== index))} aria-label="Remove feature"><Trash2 className="size-4" /></Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => set("features", [...form.features, ""])}><Plus className="size-4" aria-hidden /> Add feature</Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Technical specifications</p>
              {form.specifications.map((spec, index) => (
                <div key={index} className="flex gap-2">
                  <input className={inputClass} placeholder="Label (e.g. Power)" value={spec.label} maxLength={80} onChange={(event) => set("specifications", form.specifications.map((item, position) => (position === index ? { ...item, label: event.target.value } : item)))} aria-label={`Specification ${index + 1} label`} />
                  <input className={inputClass} placeholder="Value (e.g. 540 W)" value={spec.value} maxLength={200} onChange={(event) => set("specifications", form.specifications.map((item, position) => (position === index ? { ...item, value: event.target.value } : item)))} aria-label={`Specification ${index + 1} value`} />
                  <Button variant="ghost" size="sm" onClick={() => set("specifications", form.specifications.filter((_, position) => position !== index))} aria-label="Remove specification"><Trash2 className="size-4" /></Button>
                </div>
              ))}
              {err("specifications")}
              <Button variant="secondary" size="sm" onClick={() => set("specifications", [...form.specifications, { label: "", value: "" }])}><Plus className="size-4" aria-hidden /> Add specification</Button>
              <p className="text-xs text-slate-500">Specifications that differ between products become filters on the shop.</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Variants" description="A variant is a separate product (own SKU, price and stock) grouped under a main product, e.g. 3 kW / 5 kW." />
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field label="Variant of (main product id)" hint="Leave empty for a main product">
              <input className={inputClass} inputMode="numeric" value={form.variantOfId} onChange={(event) => set("variantOfId", event.target.value.replace(/\D/g, ""))} />
            </Field>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Variant attributes</p>
              {form.attributes.map((attribute, index) => (
                <div key={index} className="flex gap-2">
                  <input className={inputClass} placeholder="Name (e.g. Capacity)" value={attribute.key} maxLength={50} onChange={(event) => set("attributes", form.attributes.map((item, position) => (position === index ? { ...item, key: event.target.value } : item)))} aria-label="Attribute name" />
                  <input className={inputClass} placeholder="Value (e.g. 5 kW)" value={attribute.value} maxLength={100} onChange={(event) => set("attributes", form.attributes.map((item, position) => (position === index ? { ...item, value: event.target.value } : item)))} aria-label="Attribute value" />
                  <Button variant="ghost" size="sm" onClick={() => set("attributes", form.attributes.filter((_, position) => position !== index))} aria-label="Remove attribute"><Trash2 className="size-4" /></Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => set("attributes", [...form.attributes, { key: "", value: "" }])}><Plus className="size-4" aria-hidden /> Add attribute</Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Warranty, delivery and merchandising" />
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field label="Warranty information" hint="Shown on the product page — use the manufacturer's approved terms"><textarea className={`${inputClass} min-h-16`} value={form.warrantyInfo} onChange={text("warrantyInfo")} maxLength={500} /></Field>
            <Field label="Delivery information"><textarea className={`${inputClass} min-h-16`} value={form.deliveryInfo} onChange={text("deliveryInfo")} maxLength={500} /></Field>
            <div className="flex flex-wrap gap-5 md:col-span-2">
              {([["isFeatured", "Featured"], ["isBestSeller", "Best seller"], ["isNewArrival", "New arrival"], ["isOnOffer", "Special offer"]] as const).map(([key, title]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-brand-600" checked={form[key]} onChange={(event) => set(key, event.target.checked)} />
                  {title}
                </label>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="SEO" />
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field label="SEO title" hint={`${form.seoTitle.length}/160`}><input className={inputClass} value={form.seoTitle} onChange={text("seoTitle")} maxLength={160} /></Field>
            <Field label="Meta description" hint={`${form.seoDescription.length}/320`}><textarea className={`${inputClass} min-h-16`} value={form.seoDescription} onChange={text("seoDescription")} maxLength={320} /></Field>
          </div>
        </Card>
      </fieldset>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex gap-2">
          {product && (
            <a href={`${SHOP_URL}/products/${product.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
              <ExternalLink className="size-4" aria-hidden /> {product.status === "active" ? "View on shop" : "Preview (visible once active)"}
            </a>
          )}
        </div>
        {editable && (
          <div className="flex gap-2">
            {product && <Button variant="secondary" onClick={() => setConfirmDelete(true)}>Delete…</Button>}
            <Button type="submit" loading={saving}>{product ? "Save changes" : "Create product"}</Button>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this product?"
        description="Products that have orders cannot be deleted — archive them instead so order history and reports stay intact. This cannot be undone."
        confirmLabel="Delete product"
        tone="danger"
        loading={busy}
        onConfirm={() => void remove()}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  );
}
