"use client";

import { use } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProductForm, type AdminProduct } from "@/components/ecommerce/ProductForm";
import { LoadState, RequirePermission, StatusPill, useApi } from "@/components/ecommerce/kit";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, loading } = useApi<AdminProduct>(`/admin/products/${encodeURIComponent(id)}`);
  return (
    <RequirePermission permission="products.view">
      <PageHeader title={data?.name ?? "Product"} description={data ? `SKU ${data.sku}` : undefined} back={{ href: "/ecommerce/products", label: "Products" }} actions={data && <StatusPill status={data.status} />} />
      <LoadState loading={loading} error={error} empty={!data}>
        {data && <ProductForm key={data.id} product={data} />}
      </LoadState>
    </RequirePermission>
  );
}
