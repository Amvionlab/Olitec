import Image from "next/image";
import Link from "next/link";
import { Phone, ArrowRight, Home, Wrench, ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#FFF7EA] via-white to-[#F9FAFB] px-4 py-16 text-center">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <Image
            src="/images/home/olitec-logo.png"
            alt="Olitec"
            width={160}
            height={48}
            className="h-10 w-auto mx-auto"
          />
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-widest text-[#C46E0E]">
          404 · Page Not Found
        </p>

        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#161E2C] tracking-tight">
          We couldn&apos;t find that page
        </h1>

        <p className="mt-3 text-sm text-[#3C424C] leading-relaxed">
          The link you followed may be broken or the page may have been moved. You can navigate back to our main sections below.
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] text-sm font-bold text-[#161E2C] shadow-sm hover:brightness-105 transition"
          >
            <Home className="size-4" />
            <span>Return to Home</span>
          </Link>

          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-[#161E2C] hover:bg-slate-50 transition"
          >
            <span>Explore Products</span>
            <ArrowRight className="size-4 text-[#C46E0E]" />
          </Link>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-xs text-[#6B7280]">
          <p>Need urgent assistance? Call our support desk directly:</p>
          <a
            href="tel:8501800800"
            className="mt-1.5 inline-flex items-center gap-1.5 font-bold text-[#161E2C] hover:text-[#C46E0E]"
          >
            <Phone className="size-3.5 text-[#C46E0E]" />
            <span>8501 800 800</span>
          </a>
        </div>
      </div>
    </div>
  );
}
