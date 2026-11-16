"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  XCircle,
  Users,
  Package,
  Award,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { getAdminAnalytics, type AnalyticsData } from "@/services/admin";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadData = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const analytics = await getAdminAnalytics();
      setData(analytics);
    } catch (err: any) {
      setError(err?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Loading warranty analytics & database metrics…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-700">Unable to load dashboard data</p>
        <p className="mt-1 text-xs text-red-600">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Warranties",
      value: data.totalWarranties,
      badge: "All time",
      icon: Award,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
    },
    {
      label: "Active Warranties",
      value: data.activeWarranties,
      badge: "Verified",
      icon: ShieldCheck,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    },
    {
      label: "Pending Review",
      value: data.pendingWarranties,
      badge: "Action required",
      icon: Clock,
      color: "bg-amber-500/10 text-amber-600 border-amber-200",
    },
    {
      label: "Rejected Warranties",
      value: data.rejectedWarranties,
      badge: "Disallowed",
      icon: XCircle,
      color: "bg-rose-500/10 text-rose-600 border-rose-200",
    },
    {
      label: "Registered Users",
      value: data.totalUsers,
      badge: `${data.totalCustomers} customers`,
      icon: Users,
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
    },
    {
      label: "Product Master",
      value: data.totalProducts,
      badge: `${data.activeProducts} active`,
      icon: Package,
      color: "bg-slate-500/10 text-slate-700 border-slate-200",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Platform Analytics</h2>
          <p className="text-xs text-slate-500">Live metrics from MySQL warranty_db schema</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-400 shadow-sm"
          >
            <Package size={14} />
            Manage Product Master
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.color}`}>
                  <Icon size={20} />
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {card.badge}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-slate-900">{card.value}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts & Breakdowns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Registration Trends */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900">Warranty Registrations Trend</h3>
              <p className="text-xs text-slate-500">Monthly submissions breakdown</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <TrendingUp size={16} />
              <span>Real-time</span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {data.monthlyTrends.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No monthly submissions recorded yet.</p>
            ) : (
              data.monthlyTrends.map((trend) => {
                const max = Math.max(...data.monthlyTrends.map((t) => t.count), 1);
                const percent = Math.round((trend.count / max) * 100);
                return (
                  <div key={trend.month} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700">{trend.month}</span>
                      <span className="font-bold text-slate-900">{trend.count} registrations</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Product Models Registered */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900">Top Registered Models</h3>
            <p className="text-xs text-slate-500">Products with highest warranty uptake</p>
          </div>

          <div className="mt-5 space-y-3">
            {data.topProducts.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No product registrations yet.</p>
            ) : (
              data.topProducts.map((p, idx) => (
                <div key={p.model} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-700">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-xs">{p.model}</span>
                  </div>
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-slate-900 shadow-xs">
                    {p.count} units
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Warranty Submissions */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h3 className="font-bold text-slate-900">Recent Warranty Submissions</h3>
            <p className="text-xs text-slate-500">Latest registrations from the website</p>
          </div>
          <Link
            href="/admin/warranties"
            className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            <span>View All</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Warranty #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Product Model</th>
                <th className="px-6 py-3.5">Serial Number</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                data.recentRegistrations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-bold text-slate-900">{item.warrantyNumber}</td>
                    <td className="px-6 py-4 text-slate-700">{item.customerName}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{item.productModel}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{item.serialNumber}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                          item.status.toLowerCase() === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.status.toLowerCase() === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/warranties?q=${encodeURIComponent(item.warrantyNumber)}`}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
