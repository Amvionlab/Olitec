import type { WarrantyStatus } from "@/lib/types";

interface MonthlyBarChartProps {
  data: { label: string; count: number }[];
}

/** Single-series column chart. Value labels sit above each bar; hover shows the exact figure. */
export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <figure className="p-5">
      <div className="flex h-48 items-end gap-3 border-b border-slate-200" role="img" aria-label="Warranty registrations per month">
        {data.map((d) => (
          <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end" title={`${d.label}: ${d.count} registrations`}>
            <span className="mb-1 text-xs font-medium text-slate-600">{d.count}</span>
            <div
              className="w-full max-w-10 rounded-t bg-brand-500 transition-colors group-hover:bg-brand-700"
              style={{ height: `${(d.count / max) * 85}%`, minHeight: d.count ? 4 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-xs text-slate-500">
            {d.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Warranty registrations per month</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

const statusBarColor: Record<WarrantyStatus, string> = {
  Active: "bg-emerald-500",
  Pending: "bg-amber-500",
  Expired: "bg-slate-400",
  Rejected: "bg-red-500",
};

/** Status breakdown as labelled horizontal bars — each row names its status, so colour is never the only cue. */
export function StatusBreakdown({ data }: { data: { status: WarrantyStatus; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  return (
    <ul className="space-y-4 p-5">
      {data.map((d) => {
        const percent = Math.round((d.count / total) * 100);
        return (
          <li key={d.status} title={`${d.status}: ${d.count} (${percent}%)`}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-slate-700">{d.status}</span>
              <span className="font-medium text-slate-900">
                {d.count} <span className="font-normal text-slate-500">· {percent}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${statusBarColor[d.status]}`} style={{ width: `${percent}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
