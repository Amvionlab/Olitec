import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[25.528px] border-[0.912px] border-[#b7b7b7] bg-white", className)} {...props} />;
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e6e6e6] px-6 py-5">
      <div>
        <h2 className="text-[20px] font-semibold text-black">{title}</h2>
        {description && <p className="mt-0.5 text-sm font-medium text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
