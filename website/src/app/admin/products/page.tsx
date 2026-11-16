"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  type AdminProduct,
} from "@/services/admin";

const CATEGORIES = [
  "Single-Phase Hybrid Inverter",
  "Three-Phase Hybrid Inverter",
  "LiFePO4 Battery Storage",
  "Solar Home UPS",
  "Tubular Battery",
  "Solar Water Purifier",
  "Energy-Efficient Appliances",
];

export default function ProductMasterPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [priceInr, setPriceInr] = useState(0);
  const [shortDescription, setShortDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getAdminProducts({ q: search, category: categoryFilter });
      setProducts(data);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to load products" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setModelNumber("");
    setCategory(CATEGORIES[0]);
    setWarrantyMonths(12);
    setPriceInr(0);
    setShortDescription("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: AdminProduct) => {
    setEditingProduct(p);
    setName(p.name);
    setModelNumber(p.model);
    setCategory(p.category);
    setWarrantyMonths(p.warrantyMonths);
    setPriceInr(p.priceInr);
    setShortDescription(p.shortDescription || "");
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !modelNumber.trim()) {
      setMessage({ type: "error", text: "Please provide product name and model number." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      if (editingProduct) {
        await updateAdminProduct(editingProduct.numericId, {
          name,
          modelNumber,
          category,
          warrantyMonths: Number(warrantyMonths),
          priceInr: Number(priceInr),
          shortDescription,
          isActive,
        });
        setMessage({ type: "success", text: `Product "${name}" updated successfully!` });
      } else {
        await createAdminProduct({
          name,
          modelNumber,
          category,
          warrantyMonths: Number(warrantyMonths),
          priceInr: Number(priceInr),
          shortDescription,
          isActive,
        });
        setMessage({
          type: "success",
          text: `Product "${name}" added to Product Master! It now reflects in warranty registration.`,
        });
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Error saving product." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: AdminProduct) => {
    if (!window.confirm(`Deactivate product "${p.name}" (${p.model})?`)) return;
    try {
      await deleteAdminProduct(p.numericId);
      setMessage({ type: "success", text: `Product "${p.name}" deactivated.` });
      loadProducts();
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to deactivate product." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Product Master</h2>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Define authorized models. These immediately populate the Warranty Registration dropdown!
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400"
        >
          <Plus size={16} />
          <span>Add New Product</span>
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
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by model or name (e.g. OLI-1H3L, Hybrid, LiFePO4)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 transition focus:border-amber-500 focus:bg-white focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={loadProducts}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100"
            title="Reload products"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Model Number</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Warranty</th>
                <th className="px-6 py-4">Price (INR)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    <p className="mt-2">Loading products…</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No products found. Click "Add New Product" to register your first model.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{p.model}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600">{p.category}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{p.warrantyMonths} Months</td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {p.priceInr ? `₹${Number(p.priceInr).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          <XCircle size={12} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit Product"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                          title="Deactivate Product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Package className="text-amber-500" size={20} />
                <h3 className="font-bold text-slate-900">
                  {editingProduct ? "Edit Product Model" : "Add Product to Master"}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Product Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. OLI-1H series, 3 to 6 kW or PowerMax 1100"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Model Number / SKU</label>
                  <input
                    type="text"
                    value={modelNumber}
                    onChange={(e) => setModelNumber(e.target.value)}
                    placeholder="e.g. OLI-1H3L"
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Warranty (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Price (INR, optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={priceInr}
                    onChange={(e) => setPriceInr(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description / Specs Summary</label>
                <textarea
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Single-phase hybrid inverter with 36 kW scaling and 48 V battery support."
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-medium text-slate-700">
                  Active (display in Warranty Registration dropdown)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
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
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
