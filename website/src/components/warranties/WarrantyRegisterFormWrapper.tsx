"use client";

import { useSearchParams } from "next/navigation";
import { getProductById } from "@/services/products";
import { WarrantyRegistrationForm } from "./WarrantyRegistrationForm";

export function WarrantyRegisterFormWrapper() {
  const searchParams = useSearchParams();
  const product = searchParams.get("product");
  const defaultProductModel = product ? (getProductById(product)?.model ?? "") : "";

  return <WarrantyRegistrationForm defaultProductModel={defaultProductModel} />;
}
