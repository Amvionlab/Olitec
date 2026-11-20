
"use client";

import { useMemo, useState, useEffect } from "react";
import ProductManagementTabs from "@/components/admin/ProductManagementTabs";
import {
  Search,
  Download,
  Barcode,
  RefreshCw,
  FileSpreadsheet,
  Plus,
  X,
} from "lucide-react";

import {
  getAdminProducts,
  getAdminSerialNumbers,
  getSerialNumberStats,
  createAdminSerialNumber,
  type AdminProduct,
  type AdminSerialNumber,
  type SerialNumberStats,
} from "@/services/admin";
interface SerialNumber {
  id: number;
  serialNumber: string;
  productName: string;
  modelNumber: string;
  batchNumber: string;
  productionMonth: string;
  qrCode: string;
  createdAt: string;
  createdBy: string;
}

export default function SerialNumbersPage() {
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

const [products, setProducts] = useState<AdminProduct[]>([]);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");

const [form, setForm] = useState({
  productId: "",
  serialNumber: "",
  batchNumber: "",
  productionMonth: "",
  qrCode: "",
}); 
useEffect(() => {
  const loadProducts = async () => {
    try {
      const result = await getAdminProducts();
      setProducts(result);
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Unable to load products.");
    }
  };

  loadProducts();
}, []); 
const loadSerialData = async () => {
  try {
    setLoading(true);

    const [serialResult, statsResult] = await Promise.all([
      getAdminSerialNumbers(),
      getSerialNumberStats(),
    ]);

    setSerialNumbers(serialResult);
    setStats(statsResult);

  } catch (err) {
    console.error("Serial Number API Error:", err);
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load serial number data."
    );
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadSerialData();
}, []);
  // Connect the backend API here in the next step.
  // No dummy records are displayed.
const [serialNumbers, setSerialNumbers] = useState<AdminSerialNumber[]>([]);

const [stats, setStats] = useState<SerialNumberStats>({
  totalSerialNumbers: 0,
  totalProducts: 0,
  generatedBatches: 0,
});

const [loading, setLoading] = useState(true);
  const models = useMemo(
    () => [...new Set(serialNumbers.map((item) => item.modelNumber))],
    [serialNumbers]
  );

  const months = useMemo(
    () => [...new Set(serialNumbers.map((item) => item.productionMonth))],
    [serialNumbers]
  );

  const filteredSerials = useMemo(() => {
    return serialNumbers.filter((item) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        item.serialNumber.toLowerCase().includes(keyword) ||
        item.productName.toLowerCase().includes(keyword) ||
        item.modelNumber.toLowerCase().includes(keyword) ||
        item.batchNumber.toLowerCase().includes(keyword) ||
        (item.qrCode ?? "").toLowerCase().includes(keyword) ||
        item.createdBy.toLowerCase().includes(keyword);

      const matchesModel =
        selectedModel === "all" ||
        item.modelNumber === selectedModel;

      const matchesMonth =
        selectedMonth === "all" ||
        item.productionMonth === selectedMonth;

      return matchesSearch && matchesModel && matchesMonth;
    });
  }, [serialNumbers, search, selectedModel, selectedMonth]);

  const exportCSV = () => {
    if (!filteredSerials.length) return;

    const headers = [
      "Serial Number",
      "Product",
      "Model",
      "Batch",
      "Production Month",
      "QR Code",
      "Created At",
      "Created By",
    ];

    const rows = filteredSerials.map((item) => [
      item.serialNumber,
      item.productName,
      item.modelNumber,
      item.batchNumber,
      item.productionMonth,
      item.qrCode,
      item.createdAt,
      item.createdBy,
    ]);

    const csv = [
      headers,
      ...rows,
    ].map((row) =>
      row.map((value) =>
        `"${String(value).replace(/"/g, '""')}"`
      ).join(",")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "serial-number-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedModel("all");
    setSelectedMonth("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <ProductManagementTabs />


{/* Heading - Always next line */}
<div className="mt-8 w-full">
  <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

    {/* Left */}
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Serial Number
        </h1>

        <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700">
          {serialNumbers.length} Serials
        </span>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        Manage authorized product serial numbers and track production batches.
      </p>
    </div>

    {/* Right */}
    <div className="flex items-center gap-3">
      <button
        onClick={() => {
          setError("");
          setForm({
            productId: "",
            serialNumber: "",
            batchNumber: "",
            productionMonth: "",
            qrCode: "",
          });
          setIsModalOpen(true);
        }}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
      >
        <Plus size={18} />
        Add Serial Number
      </button>

      <button
        onClick={exportCSV}
        disabled={filteredSerials.length === 0}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        <Download size={18} />
        Export CSV
      </button>
    </div>

  </div>
</div></div>


      {/* Search and Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_240px_auto]">

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search product, model, serial, QR, batch or created by..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-500"
          >
            <option value="all">All Models</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-500"
          >
            <option value="all">All Production Months</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className="h-11 rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Clear
          </button>

        </div>
      </div>

      {/* Serial Number Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            Serial Number Records
          </h2>

          <span className="text-xs text-slate-500">
            {filteredSerials.length} of {serialNumbers.length} serials
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">

            <thead className="bg-slate-50">
              <tr>
                {[
                  "SERIAL NUMBER",
                  "PRODUCT",
                  "MODEL",
                  "BATCH NUMBER",
                  "PRODUCTION MONTH",
                  "QR CODE",
                  "CREATED AT",
                  "CREATED BY",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-xs font-bold tracking-wide text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {filteredSerials.map((item) => (
                <tr
                  key={item.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                    {item.serialNumber}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {item.productName}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {item.modelNumber}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {item.batchNumber}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {item.productionMonth}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {item.qrCode || "-"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {item.createdAt}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {item.createdBy}
                  </td>
                </tr>
              ))}

              {filteredSerials.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">

                    <div className="flex flex-col items-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                        <Barcode size={27} className="text-emerald-600" />
                      </div>

                      <h3 className="font-semibold text-slate-800">
                        No serial numbers found
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Generated serial number records will appear here.
                      </p>
                    </div>

                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

      </div>
{isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">

      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Add Serial Number
          </h2>
          <p className="text-sm text-slate-500">
            Enter product serial details
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(false)}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      <form
        className="space-y-4 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");

          if (!form.productId || !form.serialNumber.trim() ||
              !form.batchNumber.trim() || !form.productionMonth) {
            setError("Please fill all required fields.");
            return;
          }

          setSaving(true);

          try {
            await createAdminSerialNumber({
              productId: Number(form.productId),
              serialNumber: form.serialNumber.trim(),
              batchNumber: form.batchNumber.trim(),
              productionMonth: form.productionMonth,
              qrCode: form.qrCode.trim() || undefined,
            });

            setIsModalOpen(false);
            window.location.reload();
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Failed to save serial number."
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            Product *
          </label>

          <select
            required
            value={form.productId}
            onChange={(e) =>
              setForm({ ...form, productId: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 p-3 text-sm"
          >
            <option value="">Select Product</option>

            {products.map((product) => (
              <option
                key={product.numericId}
                value={product.numericId}
              >
                {product.name} ({product.model})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Serial Number *
          </label>

          <input
            required
            value={form.serialNumber}
            onChange={(e) =>
              setForm({ ...form, serialNumber: e.target.value })
            }
            placeholder="Enter serial number"
            className="w-full rounded-lg border border-slate-300 p-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Batch Number *
          </label>

          <input
            required
            value={form.batchNumber}
            onChange={(e) =>
              setForm({ ...form, batchNumber: e.target.value })
            }
            placeholder="Enter batch number"
            className="w-full rounded-lg border border-slate-300 p-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Production Month *
          </label>

          <input
            type="month"
            required
            value={form.productionMonth}
            onChange={(e) =>
              setForm({ ...form, productionMonth: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 p-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            QR Code (Optional)
          </label>

          <input
            value={form.qrCode}
            onChange={(e) =>
              setForm({ ...form, qrCode: e.target.value })
            }
            placeholder="Enter QR code data"
            className="w-full rounded-lg border border-slate-300 p-3 text-sm"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="rounded-lg border px-5 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Serial Number"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}
