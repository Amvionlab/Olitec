"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { enquiryForms, type EnquiryField } from "@/content/forms";
import { submitEnquiry } from "@/services/enquiries";
import { getStoredUser } from "@/services/auth";
import { validateEmail, validateMobile, validateName, validateRequired } from "@/lib/validation";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * Item M13: the three Connect pages, built to the Connect sample page.
 * Two columns: information on the left, the form in a card on the right that stays in view
 * while scrolling (on mobile the form moves below). Clickable cards fill the form.
 */

type Variant = "partner" | "consultation" | "career";

interface Choice {
  title: string;
  desc: string;
  /** Value written into the form field when the card is chosen. */
  value: string;
}

interface VariantContent {
  eyebrow: string;
  heading: string;
  accent: string;
  lead: string;
  choiceLabel: string;
  /** Form field that the cards fill. */
  choiceField: string;
  choices: Choice[];
  benefitsLabel?: string;
  benefits?: { title?: string; body: string }[];
  steps?: { lead: string; rest: string }[];
  closing?: string;
  formTitle: string;
}

const content: Record<Variant, VariantContent> = {
  partner: {
    eyebrow: "For channel partners",
    heading: "Grow with Olitec as a ",
    accent: "channel partner",
    lead: "We work with distributors, EPC companies and system integrators across India to bring dependable solar and storage to more customers.",
    choiceLabel: "Who we partner with · Choose yours",
    choiceField: "partnershipType",
    choices: [
      { title: "Distributors", desc: "Regional stock and supply for EPC companies and system integrators in your territory.", value: "Distributors" },
      {
        title: "EPC and system integrators",
        desc: "Design, specify and install complete Olitec systems for homes, businesses and projects, with our technical backing.",
        value: "EPC and system integrators",
      },
    ],
    benefitsLabel: "Why partner with Olitec",
    benefits: [
      { title: "Products built to last", body: "A focused range of hybrid inverters and LFP batteries designed to work together, with fewer service calls." },
      { title: "Technical support", body: "System design help, product training and commissioning support from our engineering team." },
      { title: "Marketing support", body: "Datasheets, brochures, product samples and co-branded material for your customers." },
      { title: "Service backing", body: "Warranty handling and replacement support so your customers are never left waiting." },
    ],
    steps: [
      { lead: "Share your details", rest: " using the form." },
      { lead: "Our channel team calls", rest: " to understand your business and territory." },
      { lead: "We agree", rest: " terms, pricing and onboarding." },
      { lead: "You receive", rest: " training, samples and marketing material, and start selling." },
    ],
    formTitle: "Become a partner",
  },
  consultation: {
    eyebrow: "For homes and businesses",
    heading: "Power for your ",
    accent: "home or business",
    lead: "Whether you want backup during outages, lower electricity bills or power where the grid does not reach, we will help you plan the right Olitec system.",
    choiceLabel: "I need power for · Choose one",
    choiceField: "use",
    choices: [
      { title: "Home", desc: "Backup and lower bills for your household.", value: "Home" },
      { title: "Shop or office", desc: "Keep the lights, billing and cooling running.", value: "Shop or office" },
      { title: "School, clinic or institution", desc: "Dependable power for essential services.", value: "School, clinic or institution" },
      { title: "Factory or commercial building", desc: "Three-phase power and protected operations.", value: "Factory or commercial building" },
      { title: "Farm or remote site", desc: "Power where the grid does not reach.", value: "Farm or remote site" },
      { title: "Vehicle or mobile unit", desc: "Silent power on the move.", value: "Vehicle or mobile unit" },
    ],
    steps: [
      { lead: "Tell us your needs.", rest: " Share your location, loads and goals using the form." },
      { lead: "Get a recommendation.", rest: " Our engineers suggest an inverter, battery and solar size for your site." },
      { lead: "Professional installation.", rest: " An authorised Olitec partner near you installs and commissions the system." },
      { lead: "Ongoing support.", rest: " Register your warranty and reach our service team whenever you need us." },
    ],
    formTitle: "Request a consultation",
  },
  career: {
    eyebrow: "Careers",
    heading: "Build India's energy infrastructure ",
    accent: "with us",
    lead: "At Olitec, engineers, technicians and business teams work on products and plants that keep the lights on for homes, industry and communities across the country.",
    choiceLabel: "Where you can work · Choose your area",
    choiceField: "area",
    choices: [
      { title: "Research and development", desc: "Power electronics, embedded firmware, battery management and product validation.", value: "Research and development" },
      { title: "Manufacturing and quality", desc: "Production, testing, process engineering and quality assurance.", value: "Manufacturing and quality" },
      { title: "Project engineering", desc: "Design, execution and commissioning of large-scale solar plants.", value: "Project engineering" },
      { title: "Sales and channel", desc: "Building and supporting our distributor, EPC and system integrator network.", value: "Sales and channel" },
      { title: "Service and support", desc: "Field service, remote diagnostics and customer care.", value: "Service and support" },
      { title: "Freshers", desc: "Structured training for fresh engineers and diploma holders.", value: "Freshers" },
    ],
    benefitsLabel: "Why join Olitec",
    benefits: [
      { body: "Work on products and projects that matter for the country" },
      { body: "Learn from leaders with decades of manufacturing and energy experience" },
      { body: "Training and mentoring from your first day" },
      { body: "A culture of ownership, rigour and honest communication" },
    ],
    closing: "We do not always advertise every opening. Send us your resume and we will contact you when a suitable role comes up.",
    formTitle: "Send us your resume",
  },
};

/** Field order and labels follow the sample page; fields come from content/forms.ts. */
const fieldOrder: Record<Variant, string[]> = {
  partner: ["name", "company", "mobile", "email", "partnershipType", "city", "gst", "years", "about"],
  consultation: ["name", "mobile", "email", "city", "use", "goal", "phase", "bill", "notes"],
  career: ["name", "mobile", "email", "area", "qualification", "experience", "location", "linkedin", "resume", "why"],
};

const labelOverride: Record<string, string> = { name: "", qualification: "Highest qualification" };

function CheckIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F7A34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

const inputClass =
  "block h-12 w-full rounded-xl border border-[#E2DED5] bg-white px-3.5 text-[15px] text-[#161E2C] placeholder:text-slate-400 focus:border-[#E8962C] focus:outline-none focus:ring-[3px] focus:ring-[#E8962C]/20";

function validate(field: EnquiryField, value: string, file: File | null): string | undefined {
  if (field.type === "file") {
    if (!file) return field.required ? `${field.label} is required.` : undefined;
    if (field.acceptTypes && !field.acceptTypes.includes(file.type)) return "Upload a PDF or Word file.";
    if (field.maxMb && file.size > field.maxMb * 1024 * 1024) return `${field.label} must be ${field.maxMb} MB or smaller.`;
    return undefined;
  }
  const v = value.trim();
  if (!v) return field.required ? (field.type === "select" ? `Select ${field.label.toLowerCase()}.` : validateRequired(value, field.label)) : undefined;
  if (field.type === "name") return validateName(value);
  if (field.type === "email") return validateEmail(value);
  if (field.type === "tel") return validateMobile(value);
  if (field.type === "number") return Number(v) >= 0 ? undefined : `${field.label} must be 0 or more.`;
  if (field.type === "url") return /^https?:\/\/\S+\.\S+/.test(v) ? undefined : "Enter a full link starting with https://";
  return undefined;
}

export function ConnectPage({ variant }: { variant: Variant }) {
  const c = content[variant];
  const config = enquiryForms[variant];
  const baseId = useId();
  const fields = fieldOrder[variant]
    .map((name) => config.fields.find((f) => f.name === name))
    .filter((f): f is EnquiryField => Boolean(f));

  const [values, setValues] = useState<Record<string, string>>(() =>
    variant === "consultation" ? { phase: "Not sure" } : ({} as Record<string, string>),
  );
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    setValues((v) => ({
      ...v,
      name: v.name || user.name || "",
      email: v.email || user.email || "",
      mobile: v.mobile || user.mobile || "",
    }));
  }, []);

  const set = (name: string, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => {
      if (!e[name]) return e;
      const next = { ...e };
      delete next[name];
      return next;
    });
  };

  const chosen = values[c.choiceField] ?? "";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const f of fields) {
      const err = validate(f, values[f.name] ?? "", f.type === "file" ? file : null);
      if (err) nextErrors[f.name] = err;
    }
    if (!consent) nextErrors.consent = "Please tick the box to continue.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = fields.find((f) => nextErrors[f.name]);
      if (first) document.getElementById(`${baseId}-${first.name}`)?.focus();
      return;
    }
    setSubmitting(true);
    const payload: Record<string, string> = { ...values, consent: "yes" };
    if (variant === "career") payload.fullName = values.name ?? "";
    const res = await submitEnquiry(variant, payload, file ? { resume: file } : {}).catch(() => ({
      ok: false as const,
      message: "We could not send your details. Please try again, or call us on " + siteConfig.supportPhone + ".",
    }));
    setSubmitting(false);
    if (!res.ok) {
      setErrors({ form: res.message || "We could not send your details. Please try again." });
      return;
    }
    const reference = ("data" in res && res.data?.reference) || "";
    setDone(config.success.message.replace("{reference}", reference));
  };

  const renderField = (f: EnquiryField) => {
    const id = `${baseId}-${f.name}`;
    const label = labelOverride[f.name] || (f.name === "name" ? (variant === "career" ? "Full name" : "Your name") : f.label);
    const err = errors[f.name];
    const describedBy = err ? `${id}-err` : undefined;
    const wide = f.full || f.name === "phase" || f.name === "bill" || f.type === "file" || f.type === "textarea";

    let control: React.ReactNode;
    if (f.name === "phase") {
      const opts = ["Not sure", "Single-phase", "Three-phase"];
      control = (
        <div role="radiogroup" aria-labelledby={`${id}-label`} className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#E2DED5]">
          {opts.map((o) => {
            const on = (values.phase ?? "Not sure") === o;
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set("phase", o)}
                className={cn(
                  "h-11 border-r border-[#E2DED5] text-sm font-medium transition last:border-r-0",
                  on ? "bg-[#161E2C] text-white" : "bg-white text-[#2A323F] hover:bg-[#FFF7EA]",
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
      );
    } else if (f.type === "select") {
      control = (
        <select
          id={id}
          value={values[f.name] ?? ""}
          onChange={(e) => set(f.name, e.target.value)}
          aria-invalid={Boolean(err)}
          aria-describedby={describedBy}
          className={cn(inputClass, "appearance-auto pr-3", err && "border-red-500")}
        >
          <option value="">{f.emptyOption ?? "Select"}</option>
          {f.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    } else if (f.type === "textarea") {
      control = (
        <textarea
          id={id}
          rows={4}
          value={values[f.name] ?? ""}
          onChange={(e) => set(f.name, e.target.value)}
          aria-invalid={Boolean(err)}
          aria-describedby={describedBy}
          className={cn(inputClass, "h-auto min-h-[104px] resize-y py-3", err && "border-red-500")}
        />
      );
    } else if (f.type === "file") {
      control = (
        <label
          htmlFor={id}
          className={cn(
            "flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#D9D3C7] bg-white px-4 py-3 text-center text-sm text-slate-500 transition hover:border-[#E8962C]",
            err && "border-red-500",
          )}
        >
          <input
            id={id}
            type="file"
            accept={f.accept}
            className="sr-only"
            aria-invalid={Boolean(err)}
            aria-describedby={describedBy}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setErrors((x) => ({ ...x, [f.name]: "" }));
            }}
          />
          {file ? (
            <span className="font-semibold text-[#161E2C]">{file.name}</span>
          ) : (
            <span>
              <strong className="text-[#161E2C]">Choose a file</strong> or drop it here · {f.hint}
            </span>
          )}
        </label>
      );
    } else {
      control = (
        <input
          id={id}
          type={f.type === "name" ? "text" : f.type === "tel" ? "tel" : f.type}
          inputMode={f.type === "tel" || f.type === "number" ? "numeric" : undefined}
          autoComplete={f.type === "name" ? "name" : f.type === "email" ? "email" : f.type === "tel" ? "tel" : undefined}
          value={values[f.name] ?? ""}
          onChange={(e) => set(f.name, e.target.value)}
          aria-invalid={Boolean(err)}
          aria-describedby={describedBy}
          placeholder={f.placeholder}
          className={cn(inputClass, err && "border-red-500")}
        />
      );
    }

    return (
      <div key={f.name} className={cn(wide && "sm:col-span-2")}>
        <label id={`${id}-label`} htmlFor={f.name === "phase" ? undefined : id} className="mb-1.5 block text-[13px] font-semibold text-[#161E2C]">
          {label}
          {f.required && <span className="text-[#D45C0A]"> *</span>}
        </label>
        {control}
        {err && (
          <p id={`${id}-err`} className="mt-1 text-xs text-red-600">
            {err}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-8 xl:px-12">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-14">
        {/* Left: information */}
        <div className="min-w-0">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#D45C0A]">{c.eyebrow}</p>
          <h2 className="mt-2 text-[28px] font-bold leading-tight text-[#161E2C] sm:text-[34px]">
            {c.heading}
            <span className="text-[#D45C0A]">{c.accent}</span>
          </h2>
          <p className="mt-3 max-w-[640px] text-base leading-relaxed text-[#2A323F] sm:text-[17px]">{c.lead}</p>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-[#4B5563]">{c.choiceLabel}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={c.choiceLabel}>
            {c.choices.map((ch) => {
              const on = chosen === ch.value;
              return (
                <button
                  key={ch.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set(c.choiceField, ch.value)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition sm:p-5",
                    on ? "border-[#161E2C] bg-[#FFF7EA] shadow-[0_0_0_1px_#161E2C]" : "border-[#E6E2D8] bg-white hover:border-[#E8962C]",
                  )}
                >
                  <span className="block text-[15px] font-bold text-[#161E2C]">{ch.title}</span>
                  <span className="mt-1 block text-[13.5px] leading-relaxed text-[#4B5563]">{ch.desc}</span>
                </button>
              );
            })}
          </div>

          {c.benefits && (
            <>
              <p className="mt-9 text-xs font-bold uppercase tracking-[0.14em] text-[#4B5563]">{c.benefitsLabel}</p>
              <ul className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {c.benefits.map((b) => (
                  <li key={b.body} className="flex gap-2.5">
                    <CheckIcon />
                    <span className="text-[14.5px] leading-relaxed text-[#2A323F]">
                      {b.title && <strong className="block font-bold text-[#161E2C]">{b.title}</strong>}
                      {b.body}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {c.steps && (
            <>
              <p className="mt-9 text-xs font-bold uppercase tracking-[0.14em] text-[#4B5563]">How it works</p>
              <ol className="mt-4 space-y-3.5">
                {c.steps.map((s, i) => (
                  <li key={s.lead} className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F3BE48] text-[13px] font-bold text-[#161E2C]">
                      {i + 1}
                    </span>
                    <p className="pt-[3px] text-[15px] leading-relaxed text-[#2A323F]">
                      <strong className="font-bold text-[#161E2C]">{s.lead}</strong>
                      {s.rest}
                    </p>
                  </li>
                ))}
              </ol>
            </>
          )}

          {c.closing && <p className="mt-8 max-w-[640px] text-[15px] leading-relaxed text-[#2A323F]">{c.closing}</p>}

          {variant === "consultation" && (
            <div className="mt-9 grid gap-4 rounded-2xl bg-[#161E2C] p-6 text-white sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10 sm:p-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FCBC62]">Talk to us directly</p>
                <a href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`} className="mt-1 block text-2xl font-bold hover:text-[#FCBC62]">
                  {siteConfig.supportPhone}
                </a>
              </div>
              <p className="text-sm leading-relaxed text-white/80">{siteConfig.corporateAddress}</p>
            </div>
          )}
        </div>

        {/* Right: the form card, in view while scrolling */}
        <div className="min-w-0">
          <div className="rounded-[24px] border border-[#ECE7DD] bg-white p-6 shadow-[0_18px_44px_rgb(22_30_44/0.08)] sm:p-8 lg:sticky lg:top-[104px]">
            {done ? (
              <div role="status">
                <h3 className="text-2xl font-bold text-[#161E2C]">{config.success.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[#2A323F]">{done}</p>
                <button
                  type="button"
                  onClick={() => {
                    setDone(null);
                    setValues(variant === "consultation" ? { phase: "Not sure" } : ({} as Record<string, string>));
                    setFile(null);
                    setConsent(false);
                  }}
                  className="mt-6 inline-flex h-11 items-center rounded-full border border-[#161E2C] px-6 text-sm font-semibold text-[#161E2C] hover:bg-[#161E2C] hover:text-white"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit}>
                <h3 className="text-[22px] font-bold text-[#161E2C]">{c.formTitle}</h3>
                <p className="mt-1 text-[13px] text-slate-500">
                  Fields marked <span className="text-[#D45C0A]">*</span> are required.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">{fields.map(renderField)}</div>

                <label className="mt-5 flex items-start gap-3 text-[14px] leading-snug text-[#2A323F]">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setErrors((x) => ({ ...x, consent: "" }));
                    }}
                    className="mt-0.5 size-[18px] shrink-0 accent-[#E8962C]"
                    aria-invalid={Boolean(errors.consent)}
                  />
                  <span>{config.consent}</span>
                </label>
                {errors.consent && <p className="mt-1 text-xs text-red-600">{errors.consent}</p>}
                {errors.form && (
                  <p role="alert" className="mt-4 text-sm text-red-600">
                    {errors.form}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 flex h-[52px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] text-[15px] font-bold text-[#161E2C] shadow-[0_8px_20px_rgb(232_150_44/0.28)] transition hover:brightness-105 disabled:opacity-60"
                >
                  {submitting ? "Sending…" : config.submitLabel}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConnectTabs({ current }: { current: "/channel-partners" | "/homes-and-businesses" | "/careers" }) {
  const tabs = [
    { href: "/channel-partners", label: "For channel partners" },
    { href: "/homes-and-businesses", label: "For homes and businesses" },
    { href: "/careers", label: "Careers" },
  ] as const;
  return (
    <nav aria-label="Connect" className="mx-auto w-full max-w-[1440px] px-4 pt-2 sm:px-8 xl:px-12">
      <div className="flex flex-wrap gap-2.5">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={current === t.href ? "page" : undefined}
            className={cn(
              "inline-flex h-11 items-center rounded-full border px-5 text-[14px] font-medium transition",
              current === t.href
                ? "border-[#161E2C] bg-[#161E2C] text-white"
                : "border-[#E2DED5] bg-white text-[#161E2C] hover:border-[#161E2C]",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
