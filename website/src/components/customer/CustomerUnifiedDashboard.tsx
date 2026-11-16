"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShieldCheck,
  Package,
  Wrench,
  FileText,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  Edit2,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  getCustomerDashboard,
  updateCustomerProfile,
  type CustomerDashboardData,
  type CustomerProfile,
} from "@/services/customer-dashboard";
import { getStoredToken, getStoredUser, clearStoredSession } from "@/services/auth";

export function CustomerUnifiedDashboard() {
  const router = useRouter();
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  // Profile Edit Mode
  const [editingProfile, setEditingProfile] = useState(false);
  const [editValues, setEditValues] = useState<{
    name: string;
    mobile: string;
    city: string;
    state: string;
    address: string;
    pincode: string;
  }>({
    name: "",
    mobile: "",
    city: "",
    state: "",
    address: "",
    pincode: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string>();

  const loadDashboard = async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const res = await getCustomerDashboard();
      setData(res);
      if (res.profile) {
        setEditValues({
          name: res.profile.name || "",
          mobile: res.profile.mobile || "",
          city: res.profile.city || "",
          state: res.profile.state || "",
          address: res.profile.address || "",
          pincode: res.profile.pincode || "",
        });
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to load dashboard data";
      if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("authentication required")) {
        clearStoredSession();
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(undefined);
    try {
      const updated = await updateCustomerProfile(editValues);
      setData((prev) => (prev ? { ...prev, profile: updated } : null));
      setEditingProfile(false);
      setProfileMsg("Profile updated successfully!");
      setTimeout(() => setProfileMsg(undefined), 3000);
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const token = getStoredToken();
  const storedUser = getStoredUser();

  if (!token && !loading) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center font-sans">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4">
          <User size={28} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sign in to view your dashboard</h2>
        <p className="mt-2 text-sm text-slate-500">
          Access your registered products, warranty coverage history, service requests, and applications in one place.
        </p>
        <button
          onClick={() => {
            window.dispatchEvent(new Event("olitec_open_login"));
          }}
          className="brand-gradient mt-6 inline-flex h-11 items-center justify-center rounded-full px-7 text-sm font-bold text-black transition-all hover:brightness-105 shadow-sm cursor-pointer"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center font-sans">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Loading your account dashboard…</p>
        </div>
      </div>
    );
  }

  const profile = data?.profile || {
    id: storedUser?.id || 1,
    name: storedUser?.name || "Customer",
    email: storedUser?.email || "",
    mobile: storedUser?.mobile || "",
    city: storedUser?.city || null,
    state: storedUser?.state || null,
    address: null,
    pincode: null,
    role: "customer",
    status: "active",
    created_at: new Date().toISOString(),
  };

  const registeredProducts = data?.registeredProducts || [];
  const warranties = data?.warranties || [];
  const serviceRequests = data?.serviceRequests || [];
  const otherSubmissions = data?.otherSubmissions || [];
  const careerApplications = data?.careerApplications || [];

  return (
    <div className="space-y-10 font-sans pb-16">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Customer Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Welcome back, {profile.name}!
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Your single unified overview of profile, registered energy systems, warranties, and inquiries
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadDashboard}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            href="/warranties/register"
            className="brand-gradient flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-black transition-all hover:brightness-105 shadow-sm active:scale-95"
          >
            <Plus size={15} />
            <span>Register a Product</span>
          </Link>
        </div>
      </div>

      {profileMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{profileMsg}</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: PROFILE DETAILS
         ========================================================================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">1. Account Profile</h2>
              <p className="text-xs text-slate-500">Your personal &amp; contact information</p>
            </div>
          </div>

          {!editingProfile ? (
            <button
              onClick={() => setEditingProfile(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
            >
              <Edit2 size={13} />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setEditingProfile(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
            >
              <X size={14} />
              Cancel
            </button>
          )}
        </div>

        {!editingProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Full Name</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{profile.name}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Email Address</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Mail size={13} className="text-slate-400" />
                {profile.email}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Mobile Number</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Phone size={13} className="text-slate-400" />
                {profile.mobile || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">City / State</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-400" />
                {profile.city ? `${profile.city}${profile.state ? `, ${profile.state}` : ""}` : "Not specified"}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editValues.name}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={editValues.mobile}
                  onChange={(e) => setEditValues({ ...editValues, mobile: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={editValues.city}
                  onChange={(e) => setEditValues({ ...editValues, city: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={editValues.state}
                  onChange={(e) => setEditValues({ ...editValues, state: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={editValues.pincode}
                  onChange={(e) => setEditValues({ ...editValues, pincode: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editValues.address}
                  onChange={(e) => setEditValues({ ...editValues, address: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="brand-gradient inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-black transition hover:brightness-105 cursor-pointer disabled:opacity-60 shadow-xs"
              >
                <Save size={13} />
                <span>{savingProfile ? "Saving…" : "Save Changes"}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* =========================================================================
          SECTION 2: REGISTERED PRODUCTS
         ========================================================================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. Registered Products</h2>
              <p className="text-xs text-slate-500">
                {registeredProducts.length} clean energy {registeredProducts.length === 1 ? "product" : "products"} linked to your account
              </p>
            </div>
          </div>

          <Link
            href="/warranties/register"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus size={13} />
            Register Product
          </Link>
        </div>

        {registeredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <Package size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-900">No products registered yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Register your Olitec lithium battery, solar inverter, or power pack using the serial number on the invoice.
            </p>
            <Link
              href="/warranties/register"
              className="brand-gradient mt-4 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold text-black hover:brightness-105 transition"
            >
              <Plus size={14} />
              Register Your First Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
            {registeredProducts.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:bg-white hover:shadow-md hover:border-brand-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {item.product_name || item.product_model}
                      </h4>
                      <p className="font-mono text-[11px] text-slate-500">S/N: {item.serial_number}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Purchased: {new Date(item.purchase_date).toLocaleDateString("en-IN")}</span>
                  {item.product_slug ? (
                    <Link
                      href={`/products/${item.product_slug}`}
                      className="font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
                    >
                      View Specs <ArrowRight size={11} />
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-400">Ref: {item.warranty_number}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 3: WARRANTIES
         ========================================================================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">3. Warranty History</h2>
              <p className="text-xs text-slate-500">Coverage validity, registration status &amp; certificates</p>
            </div>
          </div>
        </div>

        {warranties.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <ShieldCheck size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-900">No warranty registrations on file</p>
            <p className="text-xs text-slate-500 mt-1">
              When you submit a warranty registration, its approval and coverage dates will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pt-4">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Warranty No.</th>
                  <th className="px-4 py-3">Product Model</th>
                  <th className="px-4 py-3">Serial Number</th>
                  <th className="px-4 py-3">Coverage Period</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {warranties.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {w.warranty_number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {w.product_name || w.product_model}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{w.serial_number}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {w.start_date && w.end_date
                        ? `${new Date(w.start_date).toLocaleDateString("en-IN")} — ${new Date(w.end_date).toLocaleDateString("en-IN")}`
                        : "Pending review"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                          w.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : w.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {w.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {w.status === "active" ? (
                        <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 size={13} /> Active Coverage
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">In Verification</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 4: SERVICE REQUESTS (IF ANY)
         ========================================================================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Wrench size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">4. Service Requests</h2>
              <p className="text-xs text-slate-500">Service visits, repairs, and technical tickets</p>
            </div>
          </div>

          <Link
            href="/service-request"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus size={13} />
            Book Service Request
          </Link>
        </div>

        {serviceRequests.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-slate-500">
              You do not have any open service requests. Need technical assistance or an on-site visit?
            </p>
            <Link
              href="/service-request"
              className="mt-2.5 inline-block text-xs font-bold text-brand-600 hover:underline"
            >
              Submit a Service Request →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 pt-3">
            {serviceRequests.map((srv) => (
              <div key={srv.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {srv.reference_no}
                    </span>
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      {srv.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    {srv.details?.issue || "Service Inspection"}
                    {srv.details?.model ? ` (${srv.details.model})` : ""}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {srv.details?.description ? String(srv.details.description).slice(0, 100) + "..." : ""}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-[11px] text-slate-400">
                    Logged on {new Date(srv.created_at).toLocaleDateString("en-IN")}
                  </p>
                  {srv.details?.visitDate && (
                    <p className="text-[11px] font-semibold text-slate-700">
                      Preferred Date: {new Date(srv.details.visitDate).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 5: OTHER FORM SUBMISSIONS (IF ANY)
         ========================================================================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">5. Other Form Submissions</h2>
              <p className="text-xs text-slate-500">Free energy consultations &amp; channel partner inquiries</p>
            </div>
          </div>
        </div>

        {otherSubmissions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No other form inquiries on file. Need tailored clean energy solutions or interested in dealership?
            <div className="mt-2 flex items-center justify-center gap-4">
              <Link href="/homes-and-businesses" className="font-bold text-brand-600 hover:underline">
                Request Consultation →
              </Link>
              <Link href="/channel-partners" className="font-bold text-brand-600 hover:underline">
                Partner with Us →
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 pt-3">
            {otherSubmissions.map((inq) => (
              <div key={inq.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {inq.reference_no}
                    </span>
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                      {inq.kind === "consultation" ? "CONSULTATION" : "PARTNER"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {inq.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    {inq.details?.goal || inq.details?.partnershipType || inq.details?.company || "Inquiry"}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-[11px] text-slate-400">
                    Submitted: {new Date(inq.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 6: CAREERS (IF ANY)
         ========================================================================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Briefcase size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">6. Career Applications</h2>
              <p className="text-xs text-slate-500">Job applications submitted for openings at Olitec</p>
            </div>
          </div>

          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
          >
            Explore Openings
          </Link>
        </div>

        {careerApplications.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            You haven't submitted any job applications yet.{" "}
            <Link href="/careers" className="font-bold text-brand-600 hover:underline">
              View open positions at Olitec →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 pt-3">
            {careerApplications.map((app) => (
              <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {app.reference_no}
                    </span>
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {app.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    Role: {app.details?.area || "General Application"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Qualification: {app.details?.qualification || "—"} · Experience: {app.details?.experience || "—"} yrs
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-[11px] text-slate-400">
                    Applied on {new Date(app.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
