"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  Cpu,
  Factory,
  Sun,
  Users,
  Wrench,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Upload,
  Check,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { submitEnquiry, type EnquiryValues } from "@/services/enquiries";
import { getStoredUser, type UserProfile } from "@/services/auth";
import { validateEmail, validateMobile, validateName, validateRequired } from "@/lib/validation";
import { cn } from "@/lib/cn";

interface CareerArea {
  id: string;
  label: string;
  tag: string;
  icon: typeof Cpu;
  desc: string;
}

const CAREER_AREAS: CareerArea[] = [
  {
    id: "Research and development",
    label: "Research and development",
    tag: "Engineering",
    icon: Cpu,
    desc: "Power electronics topology, embedded firmware, BMS algorithms, and lab safety validation.",
  },
  {
    id: "Manufacturing and quality",
    label: "Manufacturing and quality",
    tag: "Operations",
    icon: Factory,
    desc: "Electronics assembly, automated testing, incoming QC, and precision production engineering.",
  },
  {
    id: "Project engineering",
    label: "Project engineering",
    tag: "Projects",
    icon: Sun,
    desc: "Detailed site engineering, SLD preparation, rooftop & ground-mount commissioning.",
  },
  {
    id: "Sales and channel",
    label: "Sales and channel",
    tag: "Commercial",
    icon: Users,
    desc: "Building and empowering distributor networks, technical partner enablement, and revenue growth.",
  },
  {
    id: "Service and support",
    label: "Service and support",
    tag: "Customer Care",
    icon: Wrench,
    desc: "Field diagnostics, firmware triage, customer care resolution, and warranty RMA handling.",
  },
  {
    id: "Freshers",
    label: "Freshers",
    tag: "Graduate Pathway",
    icon: GraduationCap,
    desc: "Structured training and hands-on laboratory mentoring for fresh electrical and electronics engineers.",
  },
];

export function CareersExplorer() {
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedArea, setSelectedArea] = useState<string>("Research and development");
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    qualification: "",
    experience: "",
    location: "",
    linkedin: "",
    why: "",
    consent: false,
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
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
        location: prev.location || user.city || "",
      }));
    }
  }, []);

  const handleCardSelect = (areaId: string) => {
    setSelectedArea(areaId);
    if (areaId === "Freshers" && (!formData.experience || formData.experience === "")) {
      setFormData((prev) => ({ ...prev, experience: "0" }));
    }
    if (window.innerWidth < 1024) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, resume: "Resume file must be under 5 MB." }));
        return;
      }
      setResumeFile(file);
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.resume;
        return copy;
      });
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

    const qualErr = validateRequired(formData.qualification, "Highest qualification");
    if (qualErr) nextErrors.qualification = qualErr;

    const locErr = validateRequired(formData.location, "Current location");
    if (locErr) nextErrors.location = locErr;

    if (!formData.experience && selectedArea !== "Freshers") {
      nextErrors.experience = "Enter years of experience.";
    }

    if (!resumeFile) {
      nextErrors.resume = "Please attach your resume (PDF or Word, max 5 MB).";
    }

    if (!formData.consent) {
      nextErrors.consent = "Please consent to store details for recruitment.";
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
      area: selectedArea,
      qualification: formData.qualification,
      experience: formData.experience || "0",
      location: formData.location,
      linkedin: formData.linkedin,
      why: formData.why,
    };

    const files: Record<string, File> = resumeFile ? { resume: resumeFile } : {};

    const res = await submitEnquiry("career", values, files).catch(() => ({
      ok: false as const,
      message: "Network error submitting application. Please try again.",
      fieldErrors: undefined,
    }));
    setSubmitting(false);

    if (!res.ok) {
      setErrors({ form: res.message || "Failed to submit application." });
      return;
    }

    setResult(res.data?.reference || "REF-JOB-" + Date.now().toString().slice(-6));
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 xl:px-12 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Information, Interactive Career Cards & Why Olitec (7 cols) */}
        <div className="lg:col-span-7 space-y-10">
          {/* 1. Where You Can Work - Clickable Selection Cards */}
          <div>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#D45C0A]">Career Tracks</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#161E2C] mt-1">
                Where you can work
              </h2>
            </div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
              Select an engineering division or freshers program to align your application with our active technical hiring pods.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CAREER_AREAS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedArea === item.id;
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
                      <span className={isSelected ? "text-amber-300" : "text-[#D45C0A]"}>{item.tag}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Why Join Olitec */}
          <div className="rounded-2xl border border-slate-200/90 bg-[#FBFBFA] p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-[#161E2C] mb-6">
              Why build your career at Olitec
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  title: "Direct national impact",
                  desc: "Design and build energy storage hardware that keeps India's critical healthcare, industries, and homes powered.",
                },
                {
                  title: "Mentorship from industry pioneers",
                  desc: "Work closely alongside engineers and leadership with over three decades of tier-1 solar and power electronics expertise.",
                },
                {
                  title: "Structured learning from Day 1",
                  desc: "Comprehensive lab immersion, modern simulation tools, and hands-on commissioning from your very first quarter.",
                },
                {
                  title: "Culture of engineering rigour",
                  desc: "A transparent, merit-driven environment where deep technical problem-solving and proactive ownership are rewarded.",
                },
              ].map((p) => (
                <div key={p.title} className="rounded-xl border border-slate-200/80 bg-white p-4">
                  <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-500 border-t border-slate-200/60 pt-4">
              We do not always publicly advertise every technical opening. Submit your profile and resume below, and our engineering talent team will reach out as matching vacancies are released.
            </p>
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
                <h3 className="text-2xl font-bold text-slate-900">Application Received</h3>
                <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  Thank you for your interest in joining Olitec. Your technical profile has been logged with reference:
                </p>
                <div className="mt-4 inline-block font-mono text-base font-bold text-[#D45C0A] bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                  {result}
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Our talent acquisition team will review your CV and reach out for interview rounds.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setFormData({
                      name: "",
                      mobile: "",
                      email: "",
                      qualification: "",
                      experience: "",
                      location: "",
                      linkedin: "",
                      why: "",
                      consent: false,
                    });
                    setResumeFile(null);
                  }}
                  className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  Submit another application
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit}>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#161E2C]">Submit application</h3>
                    <span className="rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-bold">
                      {selectedArea}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Fill the form below. Fields are streamlined two to a row.
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Priya Sundaram"
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

                  {/* Row 2: Email & Location */}
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Current Location *</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Chennai, Tamil Nadu"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition",
                        errors.location ? "border-red-500 bg-red-50/30" : "border-slate-300 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.location && <p className="text-[11px] text-red-600 mt-1">{errors.location}</p>}
                  </div>

                  {/* Row 3: Area of Interest (synced) & Qualification */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Area of Interest *</label>
                    <select
                      value={selectedArea}
                      onChange={(e) => handleCardSelect(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#D45C0A]"
                    >
                      {CAREER_AREAS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Highest Qualification *</label>
                    <input
                      type="text"
                      required
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      placeholder="e.g. B.E. / B.Tech / Diploma EEE"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition",
                        errors.qualification ? "border-red-500 bg-red-50/30" : "border-slate-300 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.qualification && <p className="text-[11px] text-red-600 mt-1">{errors.qualification}</p>}
                  </div>

                  {/* Row 4: Years of Experience & LinkedIn */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {selectedArea === "Freshers" ? "Years of Experience (0 for Freshers)" : "Years of Experience *"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder={selectedArea === "Freshers" ? "0" : "e.g. 3"}
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition",
                        errors.experience ? "border-red-500 bg-red-50/30" : "border-slate-300 focus:border-[#D45C0A]"
                      )}
                    />
                    {errors.experience && <p className="text-[11px] text-red-600 mt-1">{errors.experience}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Profile (Optional)</label>
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#D45C0A]"
                    />
                  </div>

                  {/* Row 5: Resume File Upload */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Attach Resume (PDF or Word, max 5 MB) *
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 transition">
                        <Upload className="size-4 text-[#D45C0A]" />
                        <span>{resumeFile ? "Change file" : "Upload Resume"}</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <span className="text-xs text-slate-500 truncate max-w-[220px]">
                        {resumeFile ? resumeFile.name : "No file selected"}
                      </span>
                    </div>
                    {errors.resume && <p className="text-[11px] text-red-600 mt-1">{errors.resume}</p>}
                  </div>

                  {/* Row 6: Why Olitec? (Optional) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Why Olitec? (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.why}
                      onChange={(e) => setFormData({ ...formData, why: e.target.value })}
                      placeholder="Your core technical interests, projects, or achievements..."
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
                    <span>I agree to Olitec storing my details for recruitment and hiring purposes.</span>
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
                      {submitting ? "Submitting application…" : "Submit application"}
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
