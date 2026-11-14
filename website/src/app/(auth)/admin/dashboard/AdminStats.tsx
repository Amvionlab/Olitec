
import {
  Users,
  Package,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

const stats = [
  {
    label: "Total Users",
    value: "0",
    icon: Users,
  },
  {
    label: "Total Products",
    value: "0",
    icon: Package,
  },
  {
    label: "Active Warranties",
    value: "0",
    icon: ShieldCheck,
  },
  {
    label: "Pending Registrations",
    value: "0",
    icon: ClipboardList,
  },
];

export default function AdminStats() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
                <Icon size={22} />
              </div>
            </div>

            <h2 className="mt-4 text-3xl font-bold text-slate-900">
              {stat.value}
            </h2>
          </div>
        );
      })}
    </div>
  );
}
