import Image from "next/image";
import { Sun } from "lucide-react";
import { cn } from "@/utils/format";

/** Product image with a neutral placeholder when the product has no image yet. Lazy-loaded unless `priority`. */
export function ProductImage({ src, alt, sizes, priority, className }: { src: string | null | undefined; alt: string; sizes: string; priority?: boolean; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-slate-100", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} preload={priority} className="object-contain p-2" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300" aria-hidden>
          <Sun className="size-12" />
        </div>
      )}
    </div>
  );
}
