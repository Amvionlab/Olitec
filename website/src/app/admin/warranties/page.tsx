"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  Check,
  X,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  getAdminWarranties,
  approveWarranty,
  rejectWarranty,
  type AdminWarranty,
  type PaginationMeta,
} from "@/services/admin";
import { getStoredToken, clearStoredSession } from "@/services/auth";

export default function WarrantyDeskPage() {
  const router = useRouter();
  const [warranties, setWarranties] = useState<AdminWarranty[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Review Modal State
  const [selectedWarranty, setSelectedWarranty] = useState<AdminWarranty | null>(null);
  const [reviewRemark, setReviewRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
        q: search,
        status: statusFilter,
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
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadWarranties();
  };

  const handleApprove = async () => {
    if (!selectedWarranty) return;
    setActionLoading(true);
    try {
      await approveWarranty(selectedWarranty.numericId, reviewRemark || "Approved by Administrator");
      setMessage({
        type: "success",
        text: `Warranty ${selectedWarranty.warrantyNumber} approved successfully. Status set to Active!`,
      });
      setSelectedWarranty(null);
      setReviewRemark("");
      loadWarranties();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to approve warranty" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWarranty) return;
    if (!reviewRemark.trim()) {
      alert("Please provide a rejection remark so the customer knows what to correct.");
      return;
    }
    setActionLoading(true);
    try {
      await rejectWarranty(selectedWarranty.numericId, reviewRemark);
      setMessage({
        type: "success",
        text: `Warranty ${selectedWarranty.warrantyNumber} marked as Rejected.`,
      });
      setSelectedWarranty(null);
      setReviewRemark("");
      loadWarranties();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to reject warranty" });
    } finally {
      setActionLoading(false);
    }
  };

  const statusTabs = [
    { label: "All Submissions", value: "all" },
    { label: "Pending Review", value: "pending" },
    { label: "Active", value: "active" },
    { label: "Rejected", value: "rejected" },
    { label: "Expired", value: "expired" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Warranty Review Desk</h2>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {meta?.total ?? warranties.length} Registrations
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Verify customer warranty registrations, invoices, serial numbers, and activate protection.
          </p>
        </div>
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
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === tab.value
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by warranty number, serial number, customer name, or mobile..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 transition focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </form>
          <button
            onClick={loadWarranties}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100"
            title="Reload warranties"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Warranties Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Warranty #</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Model &amp; Serial</th>
                <th className="px-6 py-4">Purchase Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted On</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    <p className="mt-2">Loading warranty records…</p>
                  </td>
                </tr>
              ) : warranties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No warranty registrations found for this filter.
                  </td>
                </tr>
              ) : (
                warranties.map((w) => {
                  const s = w.status.toLowerCase();
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{w.warrantyNumber}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{w.customerName}</p>
                        <p className="text-[11px] text-slate-500">
                          {w.mobile} • {w.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{w.productModel}</p>
                        <p className="font-mono text-[11px] text-slate-500">{w.serialNumber}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{w.purchaseDate}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                            s === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : s === "pending"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : s === "rejected"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {s === "active" && <CheckCircle2 size={11} />}
                          {s === "pending" && <Clock size={11} />}
                          {s === "rejected" && <XCircle size={11} />}
                          {w.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{w.submittedAt.slice(0, 10)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedWarranty(w);
                            setReviewRemark(w.adminRemark || "");
                          }}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
                        >
                          Review Desk
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Desk Modal */}
      {selectedWarranty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setSelectedWarranty(null)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-amber-500" size={22} />
                <div>
                  <h3 className="font-bold text-slate-900">
                    Warranty Review: {selectedWarranty.warrantyNumber}
                  </h3>
                  <p className="text-xs text-slate-500">Submitted on {selectedWarranty.submittedAt.slice(0, 10)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedWarranty(null)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs">
              {/* Product and Serial Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500">Registered Model</span>
                    <p className="text-sm font-bold text-slate-900">{selectedWarranty.productModel}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-500">Serial Number</span>
                    <p className="font-mono text-sm font-bold text-slate-900">{selectedWarranty.serialNumber}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-500">Purchase Date</span>
                    <p className="font-medium text-slate-800">{selectedWarranty.purchaseDate}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-500">Current Status</span>
                    <p className="font-bold capitalize text-amber-700">{selectedWarranty.status}</p>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Customer &amp; Installation Information</h4>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400">Customer Name:</span>
                    <p className="font-medium text-slate-900">{selectedWarranty.customerName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Mobile Number:</span>
                    <p className="font-medium text-slate-900">{selectedWarranty.mobile}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Email Address:</span>
                    <p className="font-medium text-slate-900">{selectedWarranty.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Authorized Dealer:</span>
                    <p className="font-medium text-slate-900">{selectedWarranty.dealerName}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Installation Address:</span>
                    <p className="font-medium text-slate-900">{selectedWarranty.installationAddress}</p>
                  </div>
                </div>
              </div>

              {/* Attached Documents */}
              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Attached Verification Documents</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <FileText className="text-amber-600 shrink-0" size={18} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">
                        {selectedWarranty.invoiceFile || "Purchase_Invoice.pdf"}
                      </p>
                      <p className="text-[10px] text-slate-400">Purchase Invoice</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <FileText className="text-blue-600 shrink-0" size={18} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">
                        {selectedWarranty.installationFile || "Installation_Report.pdf"}
                      </p>
                      <p className="text-[10px] text-slate-400">Installation Certificate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remark Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Reviewer Remark / Reason
                </label>
                <textarea
                  rows={2}
                  value={reviewRemark}
                  onChange={(e) => setReviewRemark(e.target.value)}
                  placeholder="e.g. Serial number and purchase invoice verified. Protection active."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedWarranty(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleReject}
                    className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X size={15} />
                    <span>Reject Registration</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleApprove}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <Check size={15} />
                    <span>Approve &amp; Activate Warranty</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
