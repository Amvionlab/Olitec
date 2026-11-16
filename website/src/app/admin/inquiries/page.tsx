"use client";

import { useEffect, useState } from "react";
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  ExternalLink,
  RefreshCw,
  Eye,
  Trash2,
  Briefcase,
  Wrench,
  Users,
  Lightbulb,
} from "lucide-react";
import {
  getInquiries,
  getInquiryStats,
  updateInquiryStatus,
  deleteInquiryRecord,
  type InquiryItem,
  type InquiryStats,
} from "@/services/admin-inquiries";

const KIND_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; badge: string }
> = {
  service: {
    label: "Service Request",
    icon: Wrench,
    color: "bg-red-50 text-red-700 border-red-200",
    badge: "bg-red-500/10 text-red-600",
  },
  career: {
    label: "Career Application",
    icon: Briefcase,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "bg-blue-500/10 text-blue-600",
  },
  partner: {
    label: "Channel Partner",
    icon: Users,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    badge: "bg-purple-500/10 text-purple-600",
  },
  consultation: {
    label: "Free Consultation",
    icon: Lightbulb,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    badge: "bg-amber-500/10 text-amber-600",
  },
};

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  new: { label: "New", badge: "bg-blue-100 text-blue-700 border-blue-200" },
  contacted: { label: "Contacted", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  in_progress: { label: "In Progress", badge: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  resolved: { label: "Resolved", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", badge: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [stats, setStats] = useState<InquiryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  // Filter states
  const [activeKind, setActiveKind] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Detail Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string>();

  const loadData = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [res, statsRes] = await Promise.all([
        getInquiries({
          kind: activeKind,
          status: activeStatus,
          search,
          page,
          limit: 15,
        }),
        getInquiryStats().catch(() => null),
      ]);

      setInquiries(res.inquiries);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
      if (statsRes) setStats(statsRes);
    } catch (err: any) {
      setError(err?.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeKind, activeStatus, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const openDetailModal = (inq: InquiryItem) => {
    setSelectedInquiry(inq);
    setAdminNotes(inq.admin_notes || "");
    setActionSuccess(undefined);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedInquiry) return;
    setUpdating(true);
    try {
      const updated = await updateInquiryStatus(selectedInquiry.id, newStatus, adminNotes);
      setSelectedInquiry(updated);
      setInquiries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setActionSuccess(`Status updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
      // Reload stats in background
      getInquiryStats().then(setStats).catch(() => {});
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setUpdating(true);
    try {
      const updated = await updateInquiryStatus(selectedInquiry.id, selectedInquiry.status, adminNotes);
      setSelectedInquiry(updated);
      setInquiries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setActionSuccess("Admin notes saved successfully.");
    } catch (err: any) {
      alert("Failed to save notes: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    try {
      await deleteInquiryRecord(id);
      setSelectedInquiry(null);
      setInquiries((prev) => prev.filter((item) => item.id !== id));
      loadData();
    } catch (err: any) {
      alert("Failed to delete submission: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Form Submissions</h2>
          <p className="text-xs text-slate-500">
            Incoming service requests, job applications, channel partners, and consultation leads
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Submissions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.total ?? totalCount}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-xs">
          <p className="text-xs font-semibold text-blue-700">New / Unread</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{stats?.newCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 shadow-xs">
          <p className="text-xs font-semibold text-red-700">Service Requests</p>
          <p className="mt-1 text-2xl font-bold text-red-900">{stats?.serviceCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-xs">
          <p className="text-xs font-semibold text-blue-700">Careers</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{stats?.careerCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 shadow-xs">
          <p className="text-xs font-semibold text-purple-700">Channel Partners</p>
          <p className="mt-1 text-2xl font-bold text-purple-900">{stats?.partnerCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <p className="text-xs font-semibold text-amber-700">Consultations</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{stats?.consultationCount ?? 0}</p>
        </div>
      </div>

      {/* Kind Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: "all", label: "All Forms" },
          { key: "service", label: "Service Requests", icon: Wrench },
          { key: "career", label: "Careers", icon: Briefcase },
          { key: "partner", label: "Channel Partners", icon: Users },
          { key: "consultation", label: "Consultations", icon: Lightbulb },
        ].map((tab) => {
          const isActive = activeKind === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveKind(tab.key);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {Icon && <Icon size={14} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, phone, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Status:</span>
          <select
            value={activeStatus}
            onChange={(e) => {
              setActiveStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              <p className="mt-3 text-xs text-slate-500">Loading form submissions…</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white"
            >
              Try Again
            </button>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Inbox size={24} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No form submissions found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {search || activeKind !== "all" || activeStatus !== "all"
                ? "Try clearing your filters or search keywords."
                : "New customer inquiries and service requests will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Reference &amp; Form</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Submitted On</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((inq) => {
                  const kindConfig = KIND_CONFIG[inq.kind] || {
                    label: inq.kind,
                    icon: FileText,
                    badge: "bg-slate-100 text-slate-700",
                  };
                  const statusConfig = STATUS_CONFIG[inq.status] || {
                    label: inq.status,
                    badge: "bg-slate-100 text-slate-700",
                  };
                  const KindIcon = kindConfig.icon;

                  return (
                    <tr key={inq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-slate-900">{inq.reference_no}</span>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold ${kindConfig.badge}`}
                          >
                            <KindIcon size={12} />
                            {kindConfig.label}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{inq.name}</p>
                        <p className="text-slate-500">{inq.email}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{inq.mobile}</p>
                      </td>

                      <td className="px-5 py-3.5 text-slate-700">
                        {inq.city ? (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            {inq.city}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${statusConfig.badge}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(inq.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDetailModal(inq)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 font-bold text-amber-700 hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs">
            <span className="text-slate-500">
              Showing page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {KIND_CONFIG[selectedInquiry.kind]?.label || selectedInquiry.kind}
                  </h3>
                  <p className="font-mono text-xs text-slate-500">Ref: {selectedInquiry.reference_no}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {actionSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Contact Information Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Applicant / Customer Info
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Name:</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedInquiry.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Email:</span>
                    <a
                      href={`mailto:${selectedInquiry.email}`}
                      className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Mail size={12} />
                      {selectedInquiry.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Phone:</span>
                    <a
                      href={`tel:${selectedInquiry.mobile}`}
                      className="font-semibold text-slate-900 flex items-center gap-1"
                    >
                      <Phone size={12} />
                      {selectedInquiry.mobile}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block">City / Location:</span>
                    <span className="font-medium text-slate-800">
                      {selectedInquiry.city || "Not provided"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Details Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Form Specific Responses
                </h4>
                <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                  {Object.entries(selectedInquiry.details || {}).map(([key, value]) => {
                    if (["name", "email", "mobile"].includes(key)) return null;
                    return (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-start p-3 hover:bg-slate-50/50">
                        <span className="w-48 font-semibold text-slate-600 capitalize shrink-0">
                          {key.replace(/([A-Z])/g, " $1")}:
                        </span>
                        <span className="text-slate-900 font-medium break-words flex-1 mt-0.5 sm:mt-0">
                          {String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Attached file if any */}
              {selectedInquiry.file_url && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Attached File / Document
                  </h4>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                    <FileText size={18} className="text-brand-500" />
                    <span className="font-semibold text-slate-800">{selectedInquiry.file_url}</span>
                  </div>
                </div>
              )}

              {/* Status Update & Admin Notes */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Update Lead Status
                </h4>
                <div className="flex flex-wrap gap-2">
                  {["new", "contacted", "in_progress", "resolved", "closed"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={updating}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedInquiry.status === st
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {STATUS_CONFIG[st]?.label || st}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internal Admin Notes:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add follow-up notes, customer interaction details..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={handleSaveNotes}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      {updating ? "Saving…" : "Save Notes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => handleDelete(selectedInquiry.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                <Trash2 size={14} />
                Delete Submission
              </button>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
