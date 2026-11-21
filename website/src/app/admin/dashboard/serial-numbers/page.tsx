"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import ProductManagementTabs from "@/components/admin/ProductManagementTabs";
import {
  Search,
  Download,
  Barcode,
  RefreshCw,
  FileSpreadsheet,
  Plus,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
} from "lucide-react";

import {
  getAdminProducts,
  getAdminSerialNumbers,
  getSerialNumberStats,
  createAdminSerialNumber,
  bulkImportAdminSerialNumbers,
  type AdminProduct,
  type AdminSerialNumber,
  type SerialNumberStats,
  type BulkImportSerialResult,
} from "@/services/admin";
import readXlsxFile from "read-excel-file/universal";

interface ParsedBulkRow {
  rowNum: number;
  serialNumber: string;
  productModel: string;
  batchNumber: string;
  productionMonth: string;
  qrCode?: string;
  matchedProductId?: number;
  matchedProductName?: string;
  isValid: boolean;
  error?: string;
}

export default function SerialNumbersPage() {
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<AdminSerialNumber[]>([]);
  const [stats, setStats] = useState<SerialNumberStats>({
    totalSerialNumbers: 0,
    totalProducts: 0,
    generatedBatches: 0,
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Single Serial Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    serialNumber: "",
    batchNumber: "",
    productionMonth: new Date().toISOString().slice(0, 7),
    qrCode: "",
  });

  // Bulk Import Modal
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkRows, setBulkRows] = useState<ParsedBulkRow[]>([]);
  const [bulkParsing, setBulkParsing] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkImportSerialResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, serialRes, statsRes] = await Promise.all([
        getAdminProducts().catch(() => []),
        getAdminSerialNumbers().catch(() => []),
        getSerialNumberStats().catch(() => ({ totalSerialNumbers: 0, totalProducts: 0, generatedBatches: 0 })),
      ]);

      setProducts(prodRes);
      setSerialNumbers(serialRes);
      setStats(statsRes);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to load serial number data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const models = useMemo(() => {
    return [...new Set(serialNumbers.map((item) => item.modelNumber).filter(Boolean))];
  }, [serialNumbers]);

  const months = useMemo(() => {
    return [...new Set(serialNumbers.map((item) => item.productionMonth).filter(Boolean))];
  }, [serialNumbers]);

  const filteredSerials = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return serialNumbers.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.serialNumber.toLowerCase().includes(keyword) ||
        item.productName.toLowerCase().includes(keyword) ||
        item.modelNumber.toLowerCase().includes(keyword) ||
        item.batchNumber.toLowerCase().includes(keyword) ||
        (item.qrCode ?? "").toLowerCase().includes(keyword) ||
        item.createdBy.toLowerCase().includes(keyword);

      const matchesModel = selectedModel === "all" || item.modelNumber === selectedModel;
      const matchesMonth = selectedMonth === "all" || item.productionMonth === selectedMonth;

      return matchesSearch && matchesModel && matchesMonth;
    });
  }, [serialNumbers, search, selectedModel, selectedMonth]);

  const formatProductionMonth = (m?: string): string => {
    if (!m) return "—";
    if (m.includes("-") && m.length === 7) {
      const [year, month] = m.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      }
    }
    return m;
  };

  const getQrUrl = (item: AdminSerialNumber): string => {
    if (item.qrCode && (item.qrCode.startsWith("http://") || item.qrCode.startsWith("https://"))) {
      return item.qrCode;
    }
    return `https://olitec.in/warranties/register?serial=${encodeURIComponent(item.serialNumber)}`;
  };

  const formatWarranty = (months?: number): string => {
    if (!months) return "—";
    const years = Math.round(months / 12);
    return years >= 1 ? `${years} years` : `${months} months`;
  };

  const formatMrp = (mrp?: number): string => {
    if (!mrp) return "—";
    return `₹${Number(mrp).toLocaleString("en-IN")}`;
  };

  // Export CSV
  const exportCSV = () => {
    if (!filteredSerials.length) return;

    const headers = [
      "PRODUCT",
      "MODEL",
      "CAPACITY",
      "MRP",
      "WARRANTY",
      "SERIAL NUMBER",
      "PURCHASED DATE",
      "QR URL",
      "PRODUCTION MONTH",
      "BATCH NUMBER",
      "CREATED AT",
      "CREATED BY",
    ];

    const rows = filteredSerials.map((item) => [
      item.productName,
      item.modelNumber,
      item.capacity || "-",
      formatMrp(item.mrp),
      formatWarranty(item.warrantyMonths),
      item.serialNumber,
      item.purchaseDate ? item.purchaseDate.slice(0, 10) : "-",
      getQrUrl(item),
      formatProductionMonth(item.productionMonth),
      item.batchNumber,
      item.createdAt,
      item.createdBy,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `serial-number-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download Sample Template CSV
  const downloadSampleTemplate = () => {
    const sampleModel = products[0]?.model || "OLI-1H3L";
    const sampleModel2 = products[1]?.model || "OLB-5.12W";
    const currentMonth = new Date().toISOString().slice(0, 7);

    const headers = ["serialNumber", "productModel", "batchNumber", "productionMonth", "qrCode"];
    const sampleRows = [
      [`OLI-${Date.now().toString().slice(-6)}-001`, sampleModel, "BATCH-2026-A", currentMonth, "QR_PAYLOAD_001"],
      [`OLI-${Date.now().toString().slice(-6)}-002`, sampleModel, "BATCH-2026-A", currentMonth, "QR_PAYLOAD_002"],
      [`OLB-${Date.now().toString().slice(-6)}-001`, sampleModel2, "BATCH-2026-B", currentMonth, "QR_PAYLOAD_003"],
    ];

    const csv = [headers, ...sampleRows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "olitec-serial-numbers-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle single serial create
  const handleSingleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.serialNumber.trim() || !form.batchNumber.trim() || !form.productionMonth) {
      setMessage({ type: "error", text: "Please fill in all required fields (Product, Serial, Batch, Month)." });
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

      setMessage({ type: "success", text: `Serial number "${form.serialNumber.trim()}" registered successfully!` });
      setIsModalOpen(false);
      setForm({
        productId: "",
        serialNumber: "",
        batchNumber: "",
        productionMonth: new Date().toISOString().slice(0, 7),
        qrCode: "",
      });
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to create serial number." });
    } finally {
      setSaving(false);
    }
  };

  // Parse CSV text
  const parseCSVText = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    return lines.map((line) => {
      const row: string[] = [];
      let inQuotes = false;
      let current = "";
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          row.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      return row;
    });
  };

  // Process uploaded file (CSV or Excel)
  const handleFileUpload = async (file: File) => {
    setBulkFile(file);
    setBulkParsing(true);
    setBulkResult(null);

    try {
      let rawRows: any[][] = [];
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (extension === "xlsx" || extension === "xls") {
        rawRows = (await readXlsxFile(file)) as unknown as any[][];
      } else {
        const text = await file.text();
        rawRows = parseCSVText(text);
      }

      if (!rawRows || rawRows.length < 2) {
        setMessage({ type: "error", text: "The selected file is empty or missing data rows." });
        setBulkRows([]);
        setBulkParsing(false);
        return;
      }

      // Detect header columns
      const headerRow = rawRows[0].map((h) => String(h || "").toLowerCase().replace(/[^a-z0-9]/g, ""));
      const serialIdx = headerRow.findIndex((h) => h.includes("serial") || h === "sn" || h === "sno");
      const modelIdx = headerRow.findIndex((h) => h.includes("model") || h.includes("product"));
      const batchIdx = headerRow.findIndex((h) => h.includes("batch"));
      const monthIdx = headerRow.findIndex((h) => h.includes("month") || h.includes("date") || h.includes("mfg"));
      const qrIdx = headerRow.findIndex((h) => h.includes("qr") || h.includes("code"));

      const existingSerialsSet = new Set(serialNumbers.map((s) => s.serialNumber.toLowerCase()));
      const seenSerials = new Set<string>();

      const parsed: ParsedBulkRow[] = [];

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.every((c) => !c || String(c).trim() === "")) continue;

        const serialNumber = String(row[serialIdx !== -1 ? serialIdx : 0] || "").trim();
        const productModel = String(row[modelIdx !== -1 ? modelIdx : 1] || "").trim();
        const batchNumber = String(row[batchIdx !== -1 ? batchIdx : 2] || "").trim();
        let productionMonth = String(row[monthIdx !== -1 ? monthIdx : 3] || "").trim();
        const qrCode = qrIdx !== -1 ? String(row[qrIdx] || "").trim() : undefined;

        // Clean up production month (format: YYYY-MM)
        if (productionMonth) {
          const match = productionMonth.match(/(\d{4})[-/.](\d{1,2})/);
          if (match) {
            productionMonth = `${match[1]}-${match[2].padStart(2, "0")}`;
          }
        } else {
          productionMonth = new Date().toISOString().slice(0, 7);
        }

        // Validate
        let error: string | undefined;
        let matchedProduct: AdminProduct | undefined;

        if (!serialNumber) {
          error = "Missing serial number";
        } else if (existingSerialsSet.has(serialNumber.toLowerCase())) {
          error = "Serial already exists in database";
        } else if (seenSerials.has(serialNumber.toLowerCase())) {
          error = "Duplicate serial number within file";
        } else if (!productModel) {
          error = "Missing product model";
        } else {
          // Match with products
          const modelKey = productModel.toLowerCase();
          matchedProduct = products.find(
            (p) => p.model.toLowerCase() === modelKey || p.name.toLowerCase().includes(modelKey)
          );

          if (!matchedProduct) {
            error = `Unknown model "${productModel}"`;
          } else if (!batchNumber) {
            error = "Missing batch number";
          }
        }

        if (serialNumber) {
          seenSerials.add(serialNumber.toLowerCase());
        }

        parsed.push({
          rowNum: i + 1,
          serialNumber,
          productModel,
          batchNumber: batchNumber || "DEFAULT-BATCH",
          productionMonth: productionMonth || new Date().toISOString().slice(0, 7),
          qrCode,
          matchedProductId: matchedProduct?.numericId,
          matchedProductName: matchedProduct?.name,
          isValid: !error,
          error,
        });
      }

      setBulkRows(parsed);
    } catch (err: any) {
      console.error("Failed to parse file:", err);
      setMessage({ type: "error", text: "Failed to parse file. Make sure it is a valid CSV or Excel (.xlsx) file." });
    } finally {
      setBulkParsing(false);
    }
  };

  // Submit bulk import
  const handleBulkSubmit = async () => {
    const validItems = bulkRows.filter((r) => r.isValid);
    if (validItems.length === 0) {
      alert("No valid rows found to import.");
      return;
    }

    setBulkImporting(true);
    try {
      const payload = validItems.map((r) => ({
        productId: r.matchedProductId,
        productModel: r.productModel,
        serialNumber: r.serialNumber,
        batchNumber: r.batchNumber,
        productionMonth: r.productionMonth,
        qrCode: r.qrCode,
      }));

      const res = await bulkImportAdminSerialNumbers(payload);
      setBulkResult(res);

      setMessage({
        type: "success",
        text: `Bulk Import Complete: ${res.importedCount} serial numbers added! ${res.skippedCount > 0 ? `(${res.skippedCount} skipped)` : ""}`,
      });

      // Reload serial numbers list
      await loadData();
    } catch (err: any) {
      alert("Bulk import error: " + (err?.message || "Failed to process import"));
    } finally {
      setBulkImporting(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const validCount = bulkRows.filter((r) => r.isValid).length;
  const invalidCount = bulkRows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <ProductManagementTabs />

      {/* Header Bar — Matching Serial Report */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">
            SERIAL NUMBER AUDIT
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Generated Serial Numbers</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete product, serial, QR, batch and creation audit details.
          </p>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">
            <strong className="text-slate-900">{filteredSerials.length}</strong> of {serialNumbers.length} serials
          </span>

          <button
            onClick={() => {
              setBulkFile(null);
              setBulkRows([]);
              setBulkResult(null);
              setIsBulkOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50"
            title="Import serial numbers from CSV or Excel"
          >
            <Upload size={14} className="text-amber-600" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={() => {
              setForm({
                productId: products[0]?.numericId ? String(products[0].numericId) : "",
                serialNumber: "",
                batchNumber: `BATCH-${new Date().toISOString().slice(0, 7)}`,
                productionMonth: new Date().toISOString().slice(0, 7),
                qrCode: "",
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs transition hover:bg-slate-50"
          >
            <Plus size={14} className="text-slate-600" />
            <span>Add Single</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={filteredSerials.length === 0}
            className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-40"
            title="Export filtered records to CSV"
          >
            <span>Export CSV</span>
            <Download size={14} />
          </button>
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
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, model, serial, QR, batch or created by..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 transition focus:border-amber-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Model Filter */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="all">All models</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="all">All production months</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {formatProductionMonth(month)}
              </option>
            ))}
          </select>

          {(search || selectedModel !== "all" || selectedMonth !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedModel("all");
                setSelectedMonth("all");
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Clear
            </button>
          )}

          <button
            onClick={loadData}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100"
            title="Reload records"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Serial Numbers Table — Matching Exact Report Layout */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">PRODUCT</th>
                <th className="px-5 py-3.5">MODEL</th>
                <th className="px-5 py-3.5">CAPACITY</th>
                <th className="px-5 py-3.5">MRP</th>
                <th className="px-5 py-3.5">WARRANTY</th>
                <th className="px-5 py-3.5">SERIAL NUMBER</th>
                <th className="px-5 py-3.5">PURCHASED DATE</th>
                <th className="px-5 py-3.5">QR URL</th>
                <th className="px-5 py-3.5">PRODUCTION MONTH</th>
                <th className="px-5 py-3.5">BATCH NUMBER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    <p className="mt-2 text-xs">Loading serial numbers…</p>
                  </td>
                </tr>
              ) : filteredSerials.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-14 text-center text-slate-400">
                    <Barcode size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No serial numbers found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "Add Single" or "Bulk Import" to generate serial numbers.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSerials.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. PRODUCT */}
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {item.productName || "—"}
                    </td>

                    {/* 2. MODEL */}
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                      {item.modelNumber || "—"}
                    </td>

                    {/* 3. CAPACITY */}
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {item.capacity || "—"}
                    </td>

                    {/* 4. MRP */}
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {formatMrp(item.mrp)}
                    </td>

                    {/* 5. WARRANTY */}
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {formatWarranty(item.warrantyMonths)}
                    </td>

                    {/* 6. SERIAL NUMBER */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">
                          {item.serialNumber}
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.serialNumber, item.id)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title="Copy serial number"
                        >
                          {copiedId === item.id ? (
                            <Check size={13} className="text-emerald-600" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 7. PURCHASED DATE */}
                    <td className="px-5 py-3.5">
                      {item.purchaseDate ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">
                            {new Date(item.purchaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Registered
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">—</span>
                      )}
                    </td>

                    {/* 8. QR URL */}
                    <td className="px-5 py-3.5 max-w-[220px] truncate text-slate-500">
                      <a
                        href={getQrUrl(item)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-mono text-[11px]"
                        title={getQrUrl(item)}
                      >
                        {getQrUrl(item)}
                      </a>
                    </td>

                    {/* 9. PRODUCTION MONTH */}
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {formatProductionMonth(item.productionMonth)}
                    </td>

                    {/* 10. BATCH NUMBER */}
                    <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px]">
                      {item.batchNumber || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add Single Serial Number */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Barcode className="text-amber-500" size={20} />
                <h3 className="font-bold text-slate-900">Add New Serial Number</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSingleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Select Product Model *</label>
                <select
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.numericId} value={p.numericId}>
                      {p.model} — {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Serial Number *</label>
                <input
                  type="text"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                  placeholder="e.g. OLI-2026-987654"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Batch Number *</label>
                  <input
                    type="text"
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    placeholder="e.g. BATCH-2026-07"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Production Month *</label>
                  <input
                    type="month"
                    value={form.productionMonth}
                    onChange={(e) => setForm({ ...form, productionMonth: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">QR Code Payload / Tag (Optional)</label>
                <input
                  type="text"
                  value={form.qrCode}
                  onChange={(e) => setForm({ ...form, qrCode: e.target.value })}
                  placeholder="Optional QR string or hardware barcode tag"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Serial Number"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Import (CSV / Excel) */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => !bulkImporting && setIsBulkOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-amber-500" size={22} />
                <div>
                  <h3 className="font-bold text-slate-900">Bulk Import Serial Numbers</h3>
                  <p className="text-xs text-slate-500">Upload a CSV or Excel (.xlsx) file containing serial inventory</p>
                </div>
              </div>
              <button
                onClick={() => !bulkImporting && setIsBulkOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
              {/* Instructions and Download Template Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-xs text-amber-900">
                <div>
                  <p className="font-semibold">Required Columns:</p>
                  <p className="font-mono text-[11px] text-amber-800 mt-0.5">
                    serialNumber, productModel, batchNumber, productionMonth, qrCode
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 border border-amber-300 shadow-2xs hover:bg-amber-100/50 shrink-0"
                >
                  <Download size={13} />
                  <span>Download Sample (.csv)</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50/60 hover:bg-amber-50/20 p-6 text-center transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 group-hover:scale-105 transition-transform">
                  <Upload size={22} className="text-amber-500" />
                </div>
                <p className="mt-3 text-xs font-bold text-slate-800">
                  {bulkFile ? bulkFile.name : "Click or drag & drop CSV or Excel spreadsheet"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Supports .csv, .xlsx, and .xls formats</p>
              </div>

              {/* Parsing State */}
              {bulkParsing && (
                <div className="py-6 text-center text-xs text-slate-500">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  <p className="mt-2">Reading and validating spreadsheet data…</p>
                </div>
              )}

              {/* Parsed Rows Preview */}
              {bulkRows.length > 0 && !bulkParsing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      Preview: {bulkRows.length} rows parsed
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                        {validCount} ready
                      </span>
                      {invalidCount > 0 && (
                        <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-[10px] font-bold">
                          {invalidCount} invalid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-56 overflow-x-auto overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Row</th>
                          <th className="px-3 py-2">Serial</th>
                          <th className="px-3 py-2">Model</th>
                          <th className="px-3 py-2">Batch</th>
                          <th className="px-3 py-2">Month</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {bulkRows.slice(0, 50).map((r) => (
                          <tr key={r.rowNum} className={r.isValid ? "hover:bg-slate-50/50" : "bg-red-50/40"}>
                            <td className="px-3 py-1.5 text-slate-400 font-mono">{r.rowNum}</td>
                            <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">{r.serialNumber || "—"}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-700">{r.productModel || "—"}</td>
                            <td className="px-3 py-1.5 text-slate-600">{r.batchNumber}</td>
                            <td className="px-3 py-1.5 text-slate-500 font-mono">{r.productionMonth}</td>
                            <td className="px-3 py-1.5">
                              {r.isValid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                  <CheckCircle2 size={12} /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 font-semibold" title={r.error}>
                                  <AlertCircle size={12} /> {r.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {bulkRows.length > 50 && (
                    <p className="text-[11px] text-slate-400 text-center">
                      Showing first 50 rows of {bulkRows.length} total rows.
                    </p>
                  )}
                </div>
              )}

              {/* Bulk Result Banner */}
              {bulkResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 size={18} />
                    <span>Import Completed Successfully!</span>
                  </div>
                  <p>
                    <strong>{bulkResult.importedCount}</strong> new serial numbers were registered in the database.
                    {bulkResult.skippedCount > 0 && ` ${bulkResult.skippedCount} were skipped.`}
                  </p>
                  {bulkResult.skipped.length > 0 && (
                    <div className="mt-2 text-[11px] bg-white/80 p-2 rounded border border-emerald-200 text-slate-700 max-h-24 overflow-y-auto">
                      {bulkResult.skipped.map((s, idx) => (
                        <p key={idx}>
                          Row {s.row}: {s.serialNumber || "Row"} — {s.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                {validCount > 0 ? `${validCount} records ready for registration` : ""}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkOpen(false)}
                  disabled={bulkImporting}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {bulkResult ? "Done" : "Cancel"}
                </button>
                {validCount > 0 && !bulkResult && (
                  <button
                    type="button"
                    onClick={handleBulkSubmit}
                    disabled={bulkImporting || validCount === 0}
                    className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                  >
                    {bulkImporting ? "Importing…" : `Import ${validCount} Serial Numbers`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
