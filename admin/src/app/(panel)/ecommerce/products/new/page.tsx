"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { ProductForm } from "@/components/ecommerce/ProductForm";
import { RequirePermission } from "@/components/ecommerce/kit";

export default function NewProductPage() {
  return (
    <RequirePermission permission="products.manage">
      <PageHeader title="Add product" back={{ href: "/ecommerce/products", label: "Products" }} />
      <ProductForm />
    </RequirePermission>
  );
}
