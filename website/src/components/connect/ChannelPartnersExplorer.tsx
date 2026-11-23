"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  Users,
  Factory,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Headphones,
  FileText,
  BadgeCheck,
  Check,
  Building2,
  Sparkles,
} from "lucide-react";
import { submitEnquiry, type EnquiryValues } from "@/services/enquiries";
import { getStoredUser, type UserProfile } from "@/services/auth";
import { validateEmail, validateMobile, validateName, validateRequired } from "@/lib/validation";
import { cn } from "@/lib/cn";

export function ChannelPartnersExplorer() {
  const formRef = useRef<HTMLDivElement>(null);
  const [partnerType, setPartnerType] = useState<"Distributors" | "EPC and system integrators">("Distributors");
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    mobile: "",
    email: "",
    city: "",
    gst: "",
    years: "",
    about: "",
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

  const handleCardSelect = (type: "Distributors" | "EPC and system integrators") => {
    setPartnerType(type);
    if (window.innerWidth < 1024) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    const nameErr = validateName(formData.name);
    if (nameErr) nextErrors.name = nameErr;

    const companyErr = validateRequired(formData.company, "Company name");
    if (companyErr) nextErrors.company = companyErr;

    const mobileErr = validateMobile(formData.mobile);
    if (mobileErr) nextErrors.mobile = mobileErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) nextErrors.email = emailErr;

    const cityErr = validateRequired(formData.city, "City and state");
    if (cityErr) nextErrors.city = cityErr;

    if (!formData.consent) {
      nextErrors.consent = "Please agree to proceed with the enquiry.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    const values: EnquiryValues = {
      name: formData.name,
      company: formData.company,
      mobile: formData.mobile,
      email: formData.email,
      partnershipType: partnerType,
      city: formData.city,
      gst: formData.gst,
      years: formData.years,
      about: formData.about,
    };

    const res = await submitEnquiry("partner", values).catch(() => ({
      ok: false as const,
      message: "Network error submitting enquiry. Please try again.",
      fieldErrors: undefined,
    }));
    setSubmitting(false);

    if (!res.ok) {
      setErrors({ form: res.message || "Failed to submit enquiry." });
      return;
    }

    setResult(res.data?.reference || "REF-CP-" + Date.now().toString().slice(-6));
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 xl:px-12 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Information & Interactive Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-10">
          {/* 1. Who We Partner With - Interactive Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D45C0A]">Partner Category</p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#161E2C] mt-1">
                  Who we partner with
                </h2>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-semibold text-amber-900">
                <Sparkles className="size-3.5 text-amber-600" /> Click a card to select
              </span>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
              We focus strictly on qualified trade partners and project integrators who share our commitment to dependable clean-energy infrastructure.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Distributors */}
              <button
                type="button"
                onClick={() => handleCardSelect("Distributors")}
                className={cn(
                  "text-left relative flex flex-col justify-between p-6 rounded-2xl border-2 transition-all duration-200 group cursor-pointer",
                  partnerType === "Distributors"
                    ? "border-[#161E2C] bg-[#161E2C] text-white shadow-lg ring-2 ring-[#D45C0A]/40"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-400 hover:shadow-md"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={cn(
                        "size-12 rounded-xl flex items-center justify-center transition-colors",
                        partnerType === "Distributors" ? "bg-white/10 text-amber-400" : "bg-[#FFF4E5] text-[#D45C0A]"
                      )}
                    >
                      <Users className="size-6" />
                    </div>
                    {partnerType === "Distributors" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-xs font-bold">
                        <Check className="size-3" strokeWidth={3} /> Selected
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 group-hover:text-[#D45C0A]">Select</span>
                    )}
                  </div>
                  <h3 className={cn("text-lg font-bold mb-1.5", partnerType === "Distributors" ? "text-white" : "text-[#161E2C]")}>
                    Distributors
                  </h3>
                  <p className={cn("text-xs sm:text-sm leading-relaxed", partnerType === "Distributors" ? "text-slate-300" : "text-slate-600")}>
                    Regional stock holding, technical warehousing, and supply distribution for dealers and approved installers in your designated state or territory.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
                  <span className={partnerType === "Distributors" ? "text-amber-300" : "text-[#D45C0A]"}>Wholesale Supply</span>
                  <span className={partnerType === "Distributors" ? "text-slate-300" : "text-slate-500"}>Pre-fills form &rarr;</span>
                </div>
              </button>

              {/* Card 2: EPC and System Integrators */}
              <button
                type="button"
                onClick={() => handleCardSelect("EPC and system integrators")}
                className={cn(
                  "text-left relative flex flex-col justify-between p-6 rounded-2xl border-2 transition-all duration-200 group cursor-pointer",
                  partnerType === "EPC and system integrators"
                    ? "border-[#161E2C] bg-[#161E2C] text-white shadow-lg ring-2 ring-[#D45C0A]/40"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-400 hover:shadow-md"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={cn(
                        "size-12 rounded-xl flex items-center justify-center transition-colors",
                        partnerType === "EPC and system integrators" ? "bg-white/10 text-amber-400" : "bg-[#FFF4E5] text-[#D45C0A]"
                      )}
                    >
                      <Factory className="size-6" />
                    </div>
                    {partnerType === "EPC and system integrators" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-xs font-bold">
                        <Check className="size-3" strokeWidth={3} /> Selected
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 group-hover:text-[#D45C0A]">Select</span>
                    )}
                  </div>
                  <h3 className={cn("text-lg font-bold mb-1.5", partnerType === "EPC and system integrators" ? "text-white" : "text-[#161E2C]")}>
                    EPC and system integrators
                  </h3>
                  <p className={cn("text-xs sm:text-sm leading-relaxed", partnerType === "EPC and system integrators" ? "text-slate-300" : "text-slate-600")}>
                    Specify Olitec hybrid inverters and LFP battery systems directly into commercial, industrial, institutional, and high-demand turnkey microgrid projects.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
                  <span className={partnerType === "EPC and system integrators" ? "text-amber-300" : "text-[#D45C0A]"}>Turnkey Projects</span>
                  <span className={partnerType === "EPC and system integrators" ? "text-slate-300" : "text-slate-500"}>Pre-fills form &rarr;</span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Why Partner With Olitec */}
          <div className="rounded-2xl border border-slate-200/90 bg-[#FBFBFA] p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-[#161E2C] mb-6">
              Why partner with Olitec
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Products built to last</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    A focused range of hybrid inverters and LFP batteries designed to work together, resulting in near-zero field callbacks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <Headphones className="size-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Direct technical backing</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Engineering design support, SLD review, firmware commissioning, and rapid escalation support from Chennai HQ.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Marketing & sample collateral</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Datasheets, display unit access, brochures, case studies, and co-branded project presentation support.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <BadgeCheck className="size-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Warranty commitment</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Clean digital warranty validation with prompt module replacement backing so your clients are never left stalled.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Onboarding Process (4 steps) */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#161E2C] mb-6">
              How onboarding works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { step: "01", title: "Submit form", desc: "Share your business details and territory." },
                { step: "02", title: "Team call", desc: "Our channel lead contacts you within 2 days." },
                { step: "03", title: "Commercial terms", desc: "We agree margins, inventory & onboarding." },
                { step: "04", title: "Begin supply", desc: "Receive technical training and start delivery." },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="inline-block text-xs font-black text-[#D45C0A] mb-1">{item.step}</span>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
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
                <h3 className="text-2xl font-bold text-slate-900">Enquiry Received</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  Thank you for your interest in partnering with Olitec. Your inquiry reference is:
                </p>
                <div className="mt-4 inline-block font-mono text-base font-bold text-[#D45C0A] bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                  {result}
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Our channel team will contact you within two working days.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setFormData({
                      name: "",
                      company: "",
                      mobile: "",
                      email: "",
                      city: "",
                      gst: "",
                      years: "",
                      about: "",
                      consent: false,
                    });
                  }}
                  className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  Submit another enquiry
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit}>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#161E2C]">Become a partner</h3>
                    <span className="rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-bold">
                      {partnerType}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Fill the details below. Fields are streamlined two to a row.
                  </p>
                </div>

                {currentUser && (
                  <div className="mb-5 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-950">
                    <CheckCircle2 className="size-4 text-amber-600 shrink-0" />
                    <span>Autofilled from your signed-in profile</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {/* Row 1: Your Name & Company Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Suresh Kumar"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition",
                        errors.name ? "border-red-500 bg-red-50/30" : "border-slate-300 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Apex Energy Solutions"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition",
                        errors.company ? "border-red-500 bg-red-50/30" : "border-slate-300 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.company && <p className="text-[11px] text-red-600 mt-1">{errors.company}</p>}
                  </div>

                  {/* Row 2: Mobile & Email */}
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@company.com"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition",
                        errors.email ? "border-red-500 bg-red-50/30" : "border-slate-300 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
                  </div>

                  {/* Row 3: Partnership Type & City */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Partner Type *</label>
                    <select
                      value={partnerType}
                      onChange={(e) => setPartnerType(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#D45C0A]"
                    >
                      <option value="Distributors">Distributors</option>
                      <option value="EPC and system integrators">EPC and system integrators</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City and State *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Coimbatore, Tamil Nadu"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition",
                        errors.city ? "border-red-500 bg-red-50/30" : "border-slate-300 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.city && <p className="text-[11px] text-red-600 mt-1">{errors.city}</p>}
                  </div>

                  {/* Row 4: GST (optional) & Years (optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">GST Number (Optional)</label>
                    <input
                      type="text"
                      value={formData.gst}
                      onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                      placeholder="GSTIN"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#D45C0A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Years in Business (Optional)</label>
                    <input
                      type="number"
                      value={formData.years}
                      onChange={(e) => setFormData({ ...formData, years: e.target.value })}
                      placeholder="e.g. 5"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#D45C0A]"
                    />
                  </div>

                  {/* Row 5: Tell us about your business */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tell us about your business</label>
                    <textarea
                      rows={2}
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      placeholder="Current brands distributed, customer segments, team size..."
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
                    <span>I agree to Olitec contacting me regarding channel partnership opportunities.</span>
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
                      {submitting ? "Submitting enquiry…" : "Submit enquiry"}
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
