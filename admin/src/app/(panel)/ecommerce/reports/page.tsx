"use client";

import { Suspense } from "react";
import { Download } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { LoadState, Pager, RequirePermission, inputClass, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { ECOM_API_BASE, qs } from "@/services/ecommerce/api";

interface ReportInfo {
  key: string;
  title: string;
  dated: boolean;
}

interface ReportData {
  title: string;
  dated: boolean;
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
}

const display = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  if (typeof value === "number") return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return String(value);
};

function ReportsContent() {
  const { get, set } = useUrlFilters();
  const list = useApi<ReportInfo[]>("/admin/reports");
  const key = get("report") || list.data?.[0]?.key || "";
  const range = { from: get("from"), to: get("to") };
  const report = useApi<ReportData>(key ? `/admin/reports/${key}${qs({ ...range, page: get("page") || 1, pageSize: 50 })}` : null);
  const current = list.data?.find((item) => item.key === key);

  return (
    <>
      <PageHeader title="Reports" description="Report data follows your role's permissions. CSV files open directly in Excel." />
      <LoadState loading={list.loading} error={list.error} empty={!list.data}>
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Reports">
            {list.data?.map((item) => (
              <button key={item.key} onClick={() => set({ report: item.key })} aria-current={item.key === key ? "page" : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium ${item.key === key ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-white"}`}>
                {item.title}
              </button>
            ))}
          </nav>
          <Card>
            <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
              <h2 className="mr-auto text-base font-semibold text-slate-900">{current?.title}</h2>
              {current?.dated !== false && (
                <>
                  <label className="text-xs text-slate-500">From<input type="date" className={inputClass} value={range.from} onChange={(event) => set({ from: event.target.value })} /></label>
                  <label className="text-xs text-slate-500">To<input type="date" className={inputClass} value={range.to} onChange={(event) => set({ to: event.target.value })} /></label>
                </>
              )}
              {key && <a className={buttonClasses("secondary", "md")} href={`${ECOM_API_BASE}/admin/reports/${key}${qs({ ...range, format: "csv" })}`}><Download className="size-4" aria-hidden /> Export CSV</a>}
            </div>
            {current?.dated !== false && !range.from && <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">Showing the last 30 days. Choose dates to change the range.</p>}
            <LoadState loading={report.loading} error={report.error} empty={!report.data}>
              {report.data && report.data.rows.length === 0 ? <EmptyState title="No rows for this period" /> : (
                <Table>
                  <THead><tr>{report.data?.columns.map((column) => <Th key={column.key}>{column.label}</Th>)}</tr></THead>
                  <TBody>
                    {report.data?.rows.map((row, index) => (
                      <tr key={index}>{report.data!.columns.map((column) => <Td key={column.key} className="whitespace-nowrap text-xs">{display(row[column.key])}</Td>)}</tr>
                    ))}
                  </TBody>
                </Table>
              )}
              <Pager meta={report.meta} onPage={(page) => set({ page })} />
            </LoadState>
          </Card>
        </div>
      </LoadState>
    </>
  );
}

export default function ReportsPage() {
  return (
    <RequirePermission permission="reports.view">
      <Suspense>
        <ReportsContent />
      </Suspense>
    </RequirePermission>
  );
}
