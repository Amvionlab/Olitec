"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProductManagementTabs from "@/components/admin/ProductManagementTabs";
import {
  Sparkles,
  Barcode,
  Upload,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import {
  getAdminProducts,
  bulkImportAdminSerialNumbers,
  type AdminProduct,
} from "@/services/admin";

export default function SerialGeneratorPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(20);
  const [batchNumber, setBatchNumber] = useState<string>(
    `BATCH-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-A`
  );
  const [productionMonth, setProductionMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [startSeq, setStartSeq] = useState<number>(1001);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ count: number; first: string; last: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminProducts()
      .then((data) => {
        setProducts(data);
        if (data.length > 0) {
          setSelectedProductId(String(data[0].numericId));
        }
      })
      .catch((err) => setError(err.message || "Failed to load products."))
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.numericId) === selectedProductId),
    [products, selectedProductId]
  );

  // Generate preview of serial numbers
  const previewSerials = useMemo(() => {
    if (!selectedProduct) return [];
    const prefix = selectedProduct.model.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const ym = productionMonth.replace("-", "").slice(2); // e.g. 2611
    const list: string[] = [];
    const count = Math.min(Math.max(1, quantity), 1000);
    for (let i = 0; i < count; i++) {
      const seqStr = String(startSeq + i).padStart(6, "0");
      list.push(`${prefix}${ym}${seqStr}`);
    }
    return list;
  }, [selectedProduct, productionMonth, startSeq, quantity]);

  const handleGenerateAndSave = async () => {
    if (!selectedProduct) {
      setError("Please select a product first.");
      return;
    }
    if (previewSerials.length === 0) {
      setError("No serials generated.");
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const items = previewSerials.map((sn) => ({
        productId: selectedProduct.numericId,
        productModel: selectedProduct.model,
        serialNumber: sn,
        batchNumber: batchNumber.trim() || `BATCH-${productionMonth}`,
        productionMonth: productionMonth,
        qrCode: `https://olitec.in/warranties/register?serial=${encodeURIComponent(sn)}`,
      }));

      const res = await bulkImportAdminSerialNumbers(items);
      setResult({
        count: res.importedCount,
        first: previewSerials[0],
        last: previewSerials[previewSerials.length - 1],
      });
      // Increment startSeq for next batch
      setStartSeq((prev) => prev + quantity);
    } catch (err: any) {
      setError(err?.message || "Failed to generate serial numbers.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Tabs */}
      <ProductManagementTabs />

      {/* Main Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">
              SERIAL NUMBER CREATOR
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Batch Serial Number Generator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate standardized Olitec serial numbers and scannable QR records in bulk.
            </p>
          </div>

          <Link
            href="/admin/dashboard/serial-numbers"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition"
          >
            <span>View Serial Number Report</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-emerald-900">
                Successfully generated and saved {result.count} serial numbers!
              </p>
              <p className="mt-0.5 text-emerald-700 font-mono text-[11px]">
                Range: {result.first} → {result.last}
              </p>
              <Link
                href="/admin/dashboard/serial-numbers"
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
              >
                Inspect in Serial Number Audit Report →
              </Link>
            </div>
          </div>
        )}

        {/* Generator Controls Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
            >
              {products.map((p) => (
                <option key={p.numericId} value={p.numericId}>
                  {p.name} ({p.model})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Batch Code</label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g. BATCH-202611-A"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Production Month</label>
            <input
              type="month"
              value={productionMonth}
              onChange={(e) => setProductionMonth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Quantity</label>
            <input
              type="number"
              min={1}
              max={500}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Live Pattern Preview ({previewSerials.length} serials to be generated)
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Model: {selectedProduct?.model || "—"} | Month: {productionMonth}
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 font-mono text-xs">
            {previewSerials.slice(0, 10).map((sn, idx) => (
              <div
                key={sn}
                className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 text-slate-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-sans">#{idx + 1}</span>
                  <span className="font-bold text-slate-900">{sn}</span>
                </div>
                <span className="text-[11px] text-slate-400 truncate max-w-xs">
                  https://olitec.in/warranties/register?serial={sn}
                </span>
              </div>
            ))}
            {previewSerials.length > 10 && (
              <p className="text-center text-slate-400 text-[11px] py-1">
                ... and {previewSerials.length - 10} more serial numbers
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleGenerateAndSave}
            disabled={generating || !selectedProduct}
            className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-3 text-xs font-bold text-white shadow-xs transition disabled:opacity-40"
          >
            {generating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving Serials...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Generate & Save {previewSerials.length} Serials</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
