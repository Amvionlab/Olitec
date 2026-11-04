import { Battery, ChefHat, Droplets, Fan, Snowflake, Zap, type LucideIcon } from "lucide-react";
import type { ProductCategory } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Category illustration used until real product photography is supplied.
 * Phase 2: replace with next/image once product images are available from the API or CMS.
 */
const categoryArt: Record<ProductCategory, { icon: LucideIcon; tint: string }> = {
  "Water Purifier": { icon: Droplets, tint: "from-sky-100 to-sky-50 text-sky-600" },
  Inverter: { icon: Zap, tint: "from-amber-100 to-amber-50 text-amber-600" },
  Battery: { icon: Battery, tint: "from-emerald-100 to-emerald-50 text-emerald-600" },
  "Air Cooler": { icon: Snowflake, tint: "from-cyan-100 to-cyan-50 text-cyan-600" },
  "Ceiling Fan": { icon: Fan, tint: "from-violet-100 to-violet-50 text-violet-600" },
  "Kitchen Appliance": { icon: ChefHat, tint: "from-rose-100 to-rose-50 text-rose-600" },
};

interface ProductImageProps {
  category: ProductCategory;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { box: "size-12 rounded-xl", icon: "size-6" },
  md: { box: "aspect-[4/3] w-full rounded-xl", icon: "size-14" },
  lg: { box: "aspect-square w-full rounded-2xl", icon: "size-24" },
};

export function ProductImage({ category, name, size = "md", className }: ProductImageProps) {
  const { icon: Icon, tint } = categoryArt[category];
  return (
    <div
      role="img"
      aria-label={name}
      className={cn("flex shrink-0 items-center justify-center bg-gradient-to-br", tint, sizes[size].box, className)}
    >
      <Icon className={sizes[size].icon} strokeWidth={1.5} aria-hidden />
    </div>
  );
}
