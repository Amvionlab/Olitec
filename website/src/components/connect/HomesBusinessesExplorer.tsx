"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  Home,
  Store,
  Building,
  Factory,
  Mountain,
  CheckCircle2,
  PhoneCall,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
} from "lucide-react";
import { submitEnquiry, type EnquiryValues } from "@/services/enquiries";
import { getStoredUser, type UserProfile } from "@/services/auth";
import { validateEmail, validateMobile, validateName, validateRequired } from "@/lib/validation";
import { cn } from "@/lib/cn";

interface PowerUseOption {
  id: string;
  label: string;
  tag: string;
  icon: typeof Home;
  desc: string;
}

const POWER_USE_OPTIONS: PowerUseOption[] = [
  {
    id: "Home",
    label: "Home",
    tag: "Residential",
    icon: Home,
    desc: "Uninterrupted power for fans, lights, refrigerator, and air conditioning with zero switchover flicker (<10 ms).",
  },
  {
    id: "Shop or office",
    label: "Shop or office",
    tag: "Commercial",
    icon: Store,
    desc: "Keep billing POS, servers, lighting, and air conditioners online without smelly, noisy diesel generator fumes.",
  },
  {
    id: "School, clinic or institution",
    label: "School, clinic or institution",
    tag: "Institutional",
    icon: Building,
    desc: "Dependable 24x7 solar energy and battery backup for labs, classrooms, medical diagnostic cold storage and IT.",
  },
  {
    id: "Factory or commercial building",
    label: "Factory or commercial building",
    tag: "Industrial",
    icon: Factory,
    desc: "Three-phase unbalanced output, peak shaving to cut maximum demand penalties, and continuous uptime.",
  },
  {
    id: "Farm or remote site",
    label: "Farm or remote site",
    tag: "Off-Grid",
    icon: Mountain,
    desc: "Independent power where the grid feeder line is unstable, subject to heavy voltage dips, or completely absent.",
  },
];

export function HomesBusinessesExplorer() {
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedUse, setSelectedUse] = useState<string>("Home");
  const [supplyType, setSupplyType] = useState<"Single-phase" | "Three-phase" | "Not sure">("Single-phase");
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    city: "",
    goal: "Backup during power cuts",
    bill: "",
    notes: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        mobile: prev.mobile || user.mobile || "",
        city: prev.city || user.city || "",
      }));
    }
  }, []);

  const handleCardSelect = (useId: string) => {
    setSelectedUse(useId);
    if (useId.includes("Factory") || useId.includes("commercial")) {
      setSupplyType("Three-phase");
    } else if (useId === "Home") {
      setSupplyType("Single-phase");
    }
    if (window.innerWidth < 1024) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    const nameErr = validateName(formData.name);
    if (nameErr) nextErrors.name = nameErr;

    const mobileErr = validateMobile(formData.mobile);
    if (mobileErr) nextErrors.mobile = mobileErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) nextErrors.email = emailErr;

    const cityErr = validateRequired(formData.city, "City and PIN code");
    if (cityErr) nextErrors.city = cityErr;

    if (!formData.consent) {
      nextErrors.consent = "Please agree to proceed with the consultation request.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    const values: EnquiryValues = {
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      city: formData.city,
      use: selectedUse,
      goal: formData.goal,
      phase: supplyType,
      bill: formData.bill,
      notes: formData.notes,
    };

    const res = await submitEnquiry("consultation", values).catch(() => ({
      ok: false as const,
      message: "Network error submitting consultation request. Please try again.",
      fieldErrors: undefined,
    }));
    setSubmitting(false);

    if (!res.ok) {
      setErrors({ form: res.message || "Failed to submit request." });
      return;
    }

    setResult(res.data?.reference || "REF-HB-" + Date.now().toString().slice(-6));
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 xl:px-12 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Information, Interactive Cards & Direct Contact (7 cols) */}
        <div className="lg:col-span-7 space-y-10">
          {/* 1. I Need Power For - Clickable Selection Cards */}
          <div>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#D45C0A]">Applications & Sites</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#161E2C] mt-1">
                I need power for
              </h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
              Choose your site type below to see tailored hardware configurations and synchronize your consultation request.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {POWER_USE_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedUse === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleCardSelect(item.id)}
                    className={cn(
                      "text-left relative flex flex-col justify-between p-5 rounded-2xl border-2 transition-all duration-200 group cursor-pointer",
                      isSelected
                        ? "border-[#161E2C] bg-[#161E2C] text-white shadow-lg ring-2 ring-[#D45C0A]/40"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-400 hover:shadow-md"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={cn(
                            "size-11 rounded-xl flex items-center justify-center transition-colors",
                            isSelected ? "bg-white/10 text-amber-400" : "bg-[#FFF4E5] text-[#D45C0A]"
                          )}
                        >
                          <Icon className="size-5" />
                        </div>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-xs font-bold">
                            <Check className="size-3" strokeWidth={3} /> Selected
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 group-hover:text-[#D45C0A]">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <h3 className={cn("text-base font-bold mb-1", isSelected ? "text-white" : "text-[#161E2C]")}>
                        {item.label}
                      </h3>
                      <p className={cn("text-xs leading-relaxed", isSelected ? "text-slate-300" : "text-slate-600")}>
                        {item.desc}
                      </p>
                    </div>
                    <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold">
                      <span className={isSelected ? "text-amber-300" : "text-[#D45C0A]"}>{item.tag} Solution</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. How It Works (4 Steps) */}
          <div className="rounded-2xl border border-slate-200/90 bg-[#FBFBFA] p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-[#161E2C] mb-6">
              How the process works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  step: "Step 1",
                  title: "Tell us your needs",
                  desc: "Share your site location, primary appliances, and whether you experience frequent grid outages.",
                },
                {
                  step: "Step 2",
                  title: "Engineering recommendation",
                  desc: "Our technical team sizes the exact hybrid inverter capacity and LFP battery kWh needed for your loads.",
                },
                {
                  step: "Step 3",
                  title: "Professional installation",
                  desc: "An authorized local Olitec partner commissions the inverter, solar panels, and battery storage safely.",
                },
                {
                  step: "Step 4",
                  title: "Lifetime support & warranty",
                  desc: "Instant digital warranty registration with local technical service and 10-year battery cell lifespan.",
                },
              ].map((s) => (
                <div key={s.step} className="rounded-xl border border-slate-200/80 bg-white p-4">
                  <span className="inline-block text-xs font-black text-[#D45C0A] uppercase tracking-wider mb-1">
                    {s.step}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Talk to Us Directly Card (Per Review Item 18 & M13: strictly 8501 800 800) */}
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D45C0A]">Direct Support</p>
                <h3 className="text-xl font-bold text-[#161E2C] mt-0.5">Talk to us directly</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md">
                  Have an urgent requirement or complex project? Reach our solar engineering team directly.
                </p>
              </div>
              <a
                href="tel:8501800800"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#161E2C] px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#D45C0A] transition shrink-0"
              >
                <PhoneCall className="size-4 text-amber-400" />
                <span>8501 800 800</span>
              </a>
            </div>
            <div className="mt-4 pt-4 border-t border-amber-200/50 flex items-start gap-2.5 text-xs text-slate-600">
              <MapPin className="size-4 text-[#D45C0A] shrink-0 mt-0.5" />
              <span>
                Olitec Solar Private Limited &middot; No. 5/63, Gateway House, House of Hiranandani, Egattur, OMR, Chennai 600 130
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Contact Card & Shorter Form (5 cols) */}
        <div ref={formRef} className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="rounded-[26px] border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgb(0_0_0/0.06)]">
            {result ? (
              <div className="text-center py-6">
                <div className="mx-auto size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Request Received</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  Thank you. An Olitec applications engineer will call you within one working day to review your requirements.
                </p>
                <div className="mt-4 inline-block font-mono text-base font-bold text-[#D45C0A] bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                  {result}
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Keep this reference code handy for direct queries.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setFormData({
                      name: "",
                      mobile: "",
                      email: "",
                      city: "",
                      goal: "Backup during power cuts",
                      bill: "",
                      notes: "",
                      consent: false,
                    });
                  }}
                  className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  Submit another consultation
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit}>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#161E2C]">Request consultation</h3>
                    <span className="rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-bold">
                      {selectedUse}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Fill the form below to get an engineered system recommendation.
                  </p>
                </div>

                {currentUser && (
                  <div className="mb-5 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-950">
                    <CheckCircle2 className="size-4 text-amber-600 shrink-0" />
                    <span>Autofilled from your signed-in profile</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {/* Row 1: Name & Mobile */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Anand Sharma"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition",
                        errors.name ? "border-red-500 bg-red-50/30" : "border-slate-300 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="10-digit mobile"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition",
                        errors.mobile ? "border-red-500 bg-red-50/30" : "border-slate-300 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.mobile && <p className="text-[11px] text-red-600 mt-1">{errors.mobile}</p>}
                  </div>

                  {/* Row 2: Email & City */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@domain.com"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition",
                        errors.email ? "border-red-500 bg-red-50/30" : "border-slate-300 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City and PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Madurai, 625001"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition",
                        errors.city ? "border-red-500 bg-red-50/30" : "border-slate-300 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.city && <p className="text-[11px] text-red-600 mt-1">{errors.city}</p>}
                  </div>

                  {/* Row 3: I Need Power For (Synced dropdown) & Main Goal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">I Need Power For *</label>
                    <select
                      value={selectedUse}
                      onChange={(e) => handleCardSelect(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#D45C0A]"
                    >
                      {POWER_USE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Main Goal *</label>
                    <select
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#D45C0A]"
                    >
                      <option value="Backup during power cuts">Backup during power cuts</option>
                      <option value="Lower electricity bills">Lower electricity bills</option>
                      <option value="Off-grid power">Off-grid power</option>
                      <option value="Reduce generator use">Reduce generator use</option>
                    </select>
                  </div>

                  {/* Row 4: Supply Type as Three Interactive Buttons (Per Item M13) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Supply Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Single-phase", "Three-phase", "Not sure"] as const).map((type) => {
                        const isSelected = supplyType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setSupplyType(type)}
                            className={cn(
                              "rounded-xl py-2 px-2 text-xs font-bold transition-all text-center cursor-pointer border",
                              isSelected
                                ? "bg-[#161E2C] text-white border-[#161E2C] shadow-xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                            )}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 5: Average Monthly Bill (optional) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Average Monthly Electricity Bill (₹, Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.bill}
                      onChange={(e) => setFormData({ ...formData, bill: e.target.value })}
                      placeholder="e.g. 7500"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#D45C0A]"
                    />
                  </div>

                  {/* Row 6: Anything Else (textarea) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Anything else we should know (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Appliances to power, roof space available, current generator kVA..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-[#D45C0A] resize-none"
                    />
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="mt-4">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.consent}
                      onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                      className="mt-0.5 size-4 rounded text-[#D45C0A] accent-[#D45C0A]"
                    />
                    <span>I agree to Olitec and its authorised partners contacting me about my enquiry.</span>
                  </label>
                  {errors.consent && <p className="text-[11px] text-red-600 mt-1">{errors.consent}</p>}
                </div>

                {errors.form && (
                  <p className="mt-3 text-xs text-red-600 font-semibold">{errors.form}</p>
                )}

                {/* Orange Gradient Button (Item M5 Style) */}
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full group inline-flex h-12 items-center justify-between rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] pl-6 pr-2 font-bold text-[#161E2C] shadow-[0_8px_20px_rgb(232_150_44/0.25)] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    <span className="text-sm font-extrabold tracking-wide">
                      {submitting ? "Submitting request…" : "Request consultation"}
                    </span>
                    <span className="flex size-8 items-center justify-center rounded-full bg-white text-[#161E2C] shadow-xs transition-transform group-hover:translate-x-0.5">
                      <ArrowRight className="size-4" strokeWidth={2.5} />
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
