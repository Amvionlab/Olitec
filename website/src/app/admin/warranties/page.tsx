"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  FileText,
  RefreshCw,
  ExternalLink,
  Barcode,
  Download,
  Calendar,
  User,
} from "lucide-react";
import {
  getAdminWarranties,
  type AdminWarranty,
  type PaginationMeta,
} from "@/services/admin";
import { getStoredToken, clearStoredSession } from "@/services/auth";
import { DownloadWarrantyPdfButton } from "@/components/warranties/DownloadWarrantyPdfButton";
import ProductManagementTabs from "@/components/admin/ProductManagementTabs";

export default function ProductRegistrationHistoryPage() {
  const router = useRouter();
  const [warranties, setWarranties] = useState<AdminWarranty[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadWarranties = async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await getAdminWarranties({
        q: search.trim() || undefined,
      });
      setWarranties(res.items);
      setMeta(res.meta);
    } catch (err: any) {
      const msg = err?.message || "Failed to load warranties";
      if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("authentication required")) {
        clearStoredSession();
        router.replace("/login");
        return;
      }
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarranties();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadWarranties();
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    const parsed = new Date(d);
    return isNaN(parsed.getTime())
      ? d
      : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <ProductManagementTabs />

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">
            WARRANTY AUDIT
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Product Registration History</h2>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {meta?.total ?? warranties.length} Registrations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified customer warranties matched against factory hardware serial numbers.
          </p>
        </div>

        <button
          onClick={loadWarranties}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-medium ${
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by customer name, mobile, email, serial number, product or registration number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white transition shadow-xs"
            >
              Filter
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  loadWarranties();
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Registrations Audit Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">REGISTRATION NO</th>
                <th className="px-5 py-3.5">CUSTOMER</th>
                <th className="px-5 py-3.5">PRODUCT & MODEL</th>
                <th className="px-5 py-3.5">SERIAL NUMBER</th>
                <th className="px-5 py-3.5">PURCHASE DATE</th>
                <th className="px-5 py-3.5">VALID UNTIL</th>
                <th className="px-5 py-3.5">STATUS</th>
                <th className="px-5 py-3.5 text-right">CERTIFICATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading registered warranty records…</p>
                  </td>
                </tr>
              ) : warranties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-slate-400">
                    <ShieldCheck size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No registered warranties found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Customer registrations with matching serial numbers appear here automatically.
                    </p>
                  </td>
                </tr>
              ) : (
                warranties.map((w) => {
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. REGISTRATION NO */}
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {w.warrantyNumber}
                      </td>

                      {/* 2. CUSTOMER */}
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-800">{w.customerName}</p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {w.mobile} • {w.email}
                        </p>
                      </td>

                      {/* 3. PRODUCT & MODEL */}
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{w.productName || w.productModel}</p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {w.productModel} {w.capacity ? `(${w.capacity})` : ""}
                        </p>
                      </td>

                      {/* 4. SERIAL NUMBER */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {w.serialNumber}
                        </span>
                      </td>

                      {/* 5. PURCHASE DATE */}
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {formatDate(w.purchaseDate)}
                      </td>

                      {/* 6. VALID UNTIL */}
                      <td className="px-5 py-3.5 font-semibold text-emerald-800">
                        {formatDate(w.endDate)}
                      </td>

                      {/* 7. STATUS */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          Active
                        </span>
                      </td>

                      {/* 8. CERTIFICATE ACTION */}
                      <td className="px-5 py-3.5 text-right">
                        <DownloadWarrantyPdfButton
                          data={{
                            warrantyNumber: w.warrantyNumber,
                            serialNumber: w.serialNumber,
                            customerName: w.customerName,
                            email: w.email,
                            mobile: w.mobile,
                            installationAddress: w.installationAddress,
                            productName: w.productName || w.productModel,
                            productModel: w.productModel,
                            capacity: w.capacity || "",
                            mrp: w.mrp || 0,
                            warrantyMonths: w.warrantyMonths || 60,
                            dealerName: w.dealerName,
                            purchaseDate: w.purchaseDate,
                            startDate: w.startDate || undefined,
                            endDate: w.endDate || undefined,
                            status: "Active",
                          }}
                          variant="compact"
                          label="Download PDF"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
