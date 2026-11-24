"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Phone,
  FileText,
  HelpCircle,
  Sparkles,
  Zap,
  Battery,
  Award,
  ArrowRight,
} from "lucide-react";
import { WarrantyRegistrationForm } from "@/components/warranties/WarrantyRegistrationForm";
import { WarrantyRegisterFormWrapper } from "@/components/warranties/WarrantyRegisterFormWrapper";

export function WarrantyRegisterExplorer() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* 1. Header Section */}
      <div className="max-w-3xl mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#D45C0A] mb-3">
          <ShieldCheck className="size-4" />
          <span>Manufacturer Warranty Registration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#161E2C] leading-tight">
          Register your Olitec product warranty
        </h1>
        <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
          Activate certified coverage for your hybrid inverter or energy storage system. Enjoy instant serial verification, digital certificate generation, and priority technical support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Main Column (8 cols): The 4-Step Registration Form */}
        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-9 shadow-sm hover:border-slate-300 transition">
            <Suspense fallback={<WarrantyRegistrationForm />}>
              <WarrantyRegisterFormWrapper />
            </Suspense>
          </div>
        </div>

        {/* Aside Column (4 cols): Trust, Guidance & Contact */}
        <div className="lg:col-span-4 space-y-6">
          {/* Check Status First Card */}
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-b from-[#FFF9F2] to-white p-6 shadow-xs">
            <div className="size-10 rounded-xl bg-[#FFF1DF] text-[#D45C0A] flex items-center justify-center mb-3">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Already Registered?</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              If your dealer registered your unit at delivery, verify your coverage or download your warranty certificate.
            </p>
            <div className="mt-4">
              <Link
                href="/warranty-status"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#161E2C] hover:bg-[#D45C0A] px-4 py-2.5 text-xs font-bold text-white transition shadow-xs"
              >
                <span>Check warranty status</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Where is Serial Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
              <HelpCircle className="size-4 text-[#D45C0A]" />
              <span>Where to find your serial number?</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Check the silver product rating label or dealer invoice:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="size-6 shrink-0 rounded-lg bg-amber-50 text-[#D45C0A] font-bold flex items-center justify-center text-[11px]">
                  1
                </span>
                <span><strong>Inverter:</strong> Silver barcode label on the lower-right side chassis.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-6 shrink-0 rounded-lg bg-amber-50 text-[#D45C0A] font-bold flex items-center justify-center text-[11px]">
                  2
                </span>
                <span><strong>LFP Battery:</strong> Front faceplate sticker near the terminal posts.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="size-6 shrink-0 rounded-lg bg-amber-50 text-[#D45C0A] font-bold flex items-center justify-center text-[11px]">
                  3
                </span>
                <span><strong>Invoice:</strong> Serial code printed under the product line item.</span>
              </li>
            </ul>
          </div>

          {/* Registration Benefits Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Award className="size-4 text-emerald-600" />
              <span>Owner Benefits</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Instant tamper-proof digital PDF warranty certificate</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Sub-10ms UPS component swap and priority claim handling</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Automated firmware upgrade notifications and health alerts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Direct tracking in the Olitec Customer Portal</span>
              </li>
            </ul>
          </div>

          {/* Support Hotline */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Phone className="size-4.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  NEED HELP REGISTERING?
                </span>
                <h4 className="text-base font-extrabold text-slate-900">8501 800 800</h4>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Our support team can assist you over the phone or verify your invoice directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
