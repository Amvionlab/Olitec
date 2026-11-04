import Image from "next/image";
import { legacyOverlays } from "@/content/legacy-overlays";
import { cn } from "@/lib/cn";
import { OverlaySvg } from "./OverlaySvg";

interface AnimatedIllustrationProps {
  src: string;
  alt: string;
  overlay: keyof typeof legacyOverlays;
  sizes: string;
  className?: string;
  priority?: boolean;
  children?: React.ReactNode;
}

/**
 * Illustration with its animated SVG layer on top (moving power dots, clouds, glints…),
 * as in the HTML design. The overlay is decorative; animations stop for reduced motion.
 */
export function AnimatedIllustration({ src, alt, overlay, sizes, className, priority, children }: AnimatedIllustrationProps) {
  const { viewBox, markup } = legacyOverlays[overlay];
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {children}
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      <OverlaySvg viewBox={viewBox} markup={markup} />
    </div>
  );
}
