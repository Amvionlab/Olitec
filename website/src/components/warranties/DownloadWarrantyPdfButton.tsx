"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import {
  downloadWarrantyCertificate,
  type WarrantyCertificateData,
} from "@/lib/warranty-certificate-pdf";

interface DownloadWarrantyPdfButtonProps {
  data: WarrantyCertificateData;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "compact";
  label?: string;
}

export function DownloadWarrantyPdfButton({
  data,
  className = "",
  variant = "primary",
  label = "Download Certificate (PDF)",
}: DownloadWarrantyPdfButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadWarrantyCertificate(data);
    } catch (err) {
      console.error("Failed to generate warranty PDF:", err);
      alert("Could not generate certificate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60";

  let variantStyles = "bg-amber-500 text-slate-950 hover:bg-amber-400 px-4 py-2.5";
  if (variant === "secondary") {
    variantStyles = "bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5";
  } else if (variant === "outline") {
    variantStyles = "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 px-3.5 py-2";
  } else if (variant === "compact") {
    variantStyles = "border border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100 px-2.5 py-1 text-[11px] rounded-lg";
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={`${baseStyles} ${variantStyles} ${className}`}
      title="Download official Warranty Certificate as PDF"
    >
      {downloading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Download size={14} />
      )}
      <span>{downloading ? "Generating PDF..." : label}</span>
    </button>
  );
}
