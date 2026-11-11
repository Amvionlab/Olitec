import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-[1600px] 2xl:max-w-[1680px] px-4 sm:px-8 xl:px-12 2xl:px-16", className)} {...props} />;
}
