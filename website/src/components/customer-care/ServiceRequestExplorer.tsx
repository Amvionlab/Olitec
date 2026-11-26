"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Wrench,
  Zap,
  Battery,
  Sun,
  ShieldAlert,
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Search,
  Check,
  AlertTriangle,
  Building,
  User,
  MapPin,
  FileText,
} from "lucide-react";
import { submitEnquiry, type EnquiryValues } from "@/services/enquiries";
import { getStoredUser, type UserProfile } from "@/services/auth";
import { validateEmail, validateMobile, validateName, validateRequired } from "@/lib/validation";
import { getActiveProductModels, type ServiceProductOption } from "@/services/products";
import { cn } from "@/lib/cn";

export interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  icon: typeof Zap;
  color: string;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "Inverter Fault / Error Code",
    title: "Inverter Error / Fault Code",
    description: "Red fault LED, error code on OLED screen, buzzer alarm, or unexpected shutdown.",
    icon: Zap,
    color: "from-amber-500/10 to-orange-500/10 text-[#D45C0A]",
  },
  {
    id: "Battery SOC / Not Charging",
    title: "Battery Storage / Low SOC",
    description: "Battery not charging, premature low-voltage cutoff, or BMS cell warning.",
    icon: Battery,
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-700",
  },
  {
    id: "Low Solar Generation",
    title: "Low Solar Generation",
    description: "PV generation significantly below rated capacity on clear sunlight days.",
    icon: Sun,
    color: "from-yellow-500/10 to-amber-500/10 text-amber-700",
  },
  {
    id: "Grid Tripping / Bypass Issue",
    title: "Grid Tripping / Bypass Switch",
    description: "AC breaker trips during transfer or sub-10ms UPS switchover delay observed.",
    icon: ShieldAlert,
    color: "from-blue-500/10 to-indigo-500/10 text-blue-700",
  },
  {
    id: "Routine Maintenance",
    title: "Preventive Maintenance / Check",
    description: "Annual health check, firmware upgrade, terminal torque inspection, and calibration.",
    icon: Wrench,
    color: "from-slate-500/10 to-zinc-500/10 text-slate-700",
  },
];

export function ServiceRequestExplorer({ initialSerial = "" }: { initialSerial?: string }) {
  const searchParams = useSearchParams();
  const serialFromUrl = searchParams.get("serial") || initialSerial;
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(SERVICE_CATEGORIES[0].id);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    serial: serialFromUrl,
    productModel: "",
    pincode: "",
    address: "",
    preferredDate: "",
    description: "",
    urgency: "Normal" as "Normal" | "Urgent (Power Outage)",
  });

  const [productOptions, setProductOptions] = useState<ServiceProductOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ticketId: string; message: string } | null>(null);

  useEffect(() => {
    getActiveProductModels().then((items) => {
      if (items && items.length > 0) setProductOptions(items);
    });

    const user = getStoredUser();
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        mobile: prev.mobile || user.mobile || "",
        address: prev.address || user.city || "",
      }));
    }
  }, []);

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id);
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

    if (!formData.serial.trim()) {
      nextErrors.serial = "Serial number is required to look up your warranty.";
    }

    if (!formData.address.trim()) {
      nextErrors.address = "Complete service address is required for technician dispatch.";
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      nextErrors.description = "Please describe the problem in at least 10 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    const generatedTicket = `SR-${Math.floor(100000 + Math.random() * 900000)}`;

    const values: EnquiryValues = {
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      serial: formData.serial.trim().toUpperCase(),
      product: formData.productModel || selectedCategory,
      pincode: formData.pincode,
      address: formData.address,
      preferredDate: formData.preferredDate,
      comments: `[Category: ${selectedCategory}] [Urgency: ${formData.urgency}] ${formData.description}`,
    };

    const res = await submitEnquiry("service", values);
    setSubmitting(false);

    if (res.ok) {
      setResult({
        ticketId: generatedTicket,
        message: "Your service request has been logged successfully.",
      });
    } else {
      setErrors({ form: res.message || "Could not log service request. Please try again or call 8501 800 800." });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* 1. Header Section */}
      <div className="max-w-3xl mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#D45C0A] mb-3">
          <Wrench className="size-4" />
          <span>On-Site Technical Service</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#161E2C] leading-tight">
          Raise an authorized service request
        </h2>
        <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
          Select your issue category and schedule an on-site service engineer. All warranty repairs use genuine Olitec components with guaranteed SLA turnaround.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column (7 cols): Issue Categories & SLA */}
        <div className="lg:col-span-7 space-y-8">
          {/* Issue Categories Selection */}
          <div>
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D45C0A]">Step 1</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#161E2C] mt-0.5">
                What issue are you facing?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose the matching symptom to route your ticket directly to the specialized engineer.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {SERVICE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={cn(
                      "text-left relative flex items-center justify-between p-4.5 sm:p-5 rounded-2xl border-2 transition-all duration-200 group cursor-pointer",
                      isSelected
                        ? "border-[#161E2C] bg-[#161E2C] text-white shadow-md ring-2 ring-[#D45C0A]/30"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:shadow-xs"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <div
                        className={cn(
                          "size-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          isSelected ? "bg-white/10 text-amber-400" : "bg-slate-100 text-[#D45C0A]"
                        )}
                      >
                        <IconComponent className="size-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className={cn("text-sm sm:text-base font-bold", isSelected ? "text-white" : "text-[#161E2C]")}>
                          {cat.title}
                        </h3>
                        <p className={cn("text-xs leading-relaxed mt-0.5", isSelected ? "text-slate-300" : "text-slate-500")}>
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 px-3 py-1 text-xs font-bold">
                          <Check className="size-3.5" strokeWidth={3} />
                          <span className="hidden sm:inline">Selected</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 group-hover:text-[#D45C0A]">
                          Select
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Guarantees & SLAs */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="size-4.5 text-[#D45C0A]" />
              <span>Olitec Service Guarantees</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
                  <Clock className="size-4 text-[#D45C0A]" />
                  <span>24–48 Hour On-Site SLA</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Technicians dispatched within 24 to 48 hours for verified active warranty units across all operational pin codes.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>100% Genuine Components</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Replacement parts come factory-sealed directly from our Katpadi manufacturing facility.
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Helpline Banner */}
          <div className="rounded-3xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider mb-1">
                <AlertTriangle className="size-4" />
                <span>Complete Power Outage?</span>
              </div>
              <h4 className="text-lg font-extrabold text-slate-900">
                Call Emergency Solar Helpline: 8501 800 800
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Direct phone triage with application engineering team for critical site blackouts.
              </p>
            </div>
            <a
              href="tel:8501800800"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <Phone className="size-4" />
              <span>Call 8501 800 800</span>
            </a>
          </div>
        </div>

        {/* Right Column (5 cols): The Form & What Happens Next */}
        <div ref={formRef} className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="size-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="size-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Ticket Confirmed
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  Ticket #{result.ticketId}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  {result.message} A field coordinator has been assigned and will call you on{" "}
                  <strong>{formData.mobile}</strong> to confirm the technician visit window.
                </p>
              </div>

              {/* What Happens Next Timeline */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4.5 space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  What Happens Next:
                </h4>
                <ol className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                      1
                    </span>
                    <span>SMS & WhatsApp confirmation sent with ticket tracking link.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                      2
                    </span>
                    <span>Application Engineer remote diagnostics call within 2 hours.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                      3
                    </span>
                    <span>On-site technician visit with factory-certified spare parts.</span>
                  </li>
                </ol>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setFormData({
                      name: "",
                      mobile: "",
                      email: "",
                      serial: "",
                      productModel: "",
                      pincode: "",
                      address: "",
                      preferredDate: "",
                      description: "",
                      urgency: "Normal",
                    });
                  }}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                >
                  Raise Another Request
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg shadow-slate-100">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D45C0A]">Step 2</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">Service Details</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Selected issue: <strong className="text-slate-800">{selectedCategory}</strong>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Serial Number Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-900">
                      Product Serial Number <span className="text-red-500">*</span>
                    </label>
                    <Link
                      href="/warranty-status"
                      className="text-[11px] font-semibold text-[#D45C0A] hover:underline"
                    >
                      Check status
                    </Link>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.serial}
                    onChange={(e) => {
                      setFormData({ ...formData, serial: e.target.value.toUpperCase() });
                      if (errors.serial) setErrors({ ...errors, serial: "" });
                    }}
                    placeholder="Enter registered serial number"
                    className={cn(
                      "w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm font-bold tracking-wider text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D45C0A]/30 transition",
                      errors.serial ? "border-red-400" : "border-slate-200 focus:border-[#D45C0A]"
                    )}
                  />
                  {errors.serial && <p className="mt-1 text-xs text-red-600 font-medium">{errors.serial}</p>}
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      placeholder="e.g. Rajesh Kumar"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D45C0A]/30 transition",
                        errors.name ? "border-red-400" : "border-slate-200 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Contact Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => {
                        setFormData({ ...formData, mobile: e.target.value });
                        if (errors.mobile) setErrors({ ...errors, mobile: "" });
                      }}
                      placeholder="e.g. 9845012345"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D45C0A]/30 transition",
                        errors.mobile ? "border-red-400" : "border-slate-200 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.mobile && <p className="mt-1 text-xs text-red-600 font-medium">{errors.mobile}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    placeholder="e.g. rajesh@example.com"
                    className={cn(
                      "w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D45C0A]/30 transition",
                      errors.email ? "border-red-400" : "border-slate-200 focus:border-[#D45C0A]"
                    )}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>}
                </div>

                {/* Installation Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Site Installation Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (errors.address) setErrors({ ...errors, address: "" });
                    }}
                    placeholder="Street, building, landmark, city, state"
                    className={cn(
                      "w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D45C0A]/30 transition resize-none",
                      errors.address ? "border-red-400" : "border-slate-200 focus:border-[#D45C0A]"
                    )}
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-600 font-medium">{errors.address}</p>}
                </div>

                {/* PIN Code & Preferred Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="e.g. 560038"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#D45C0A] focus:ring-2 focus:ring-[#D45C0A]/30 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">Preferred Visit Date</label>
                    <input
                      type="date"
                      min={new Date().toLocaleDateString("en-CA")}
                      value={formData.preferredDate}
                      onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#D45C0A] focus:ring-2 focus:ring-[#D45C0A]/30 transition"
                    />
                  </div>
                </div>

                {/* Problem Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Problem Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description) setErrors({ ...errors, description: "" });
                    }}
                    placeholder="Describe error code, buzzer, battery state, or when the problem started..."
                    className={cn(
                      "w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D45C0A]/30 transition resize-none",
                      errors.description ? "border-red-400" : "border-slate-200 focus:border-[#D45C0A]"
                    )}
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.description}</p>
                  )}
                </div>

                {errors.form && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {errors.form}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D45C0A] to-[#E8962C] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#D45C0A]/20 transition hover:brightness-105 active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <span>Scheduling Service...</span>
                    ) : (
                      <>
                        <Wrench className="size-4" />
                        <span>Book Service Technician</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
