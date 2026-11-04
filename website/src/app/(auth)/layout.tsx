import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[rgb(217_217_217/0.44)] px-4 py-10">
      <Link href="/" className="mb-8" aria-label={`${siteConfig.name} home`}>
        <Image src="/images/home/olitec-logo.png" alt={siteConfig.name} width={202} height={61} priority className="h-[52px] w-auto" />
      </Link>
      <div className="w-full max-w-md rounded-[30px] border-[0.912px] border-[#b7b7b7] bg-white p-6 sm:p-10">{children}</div>
      <p className="mt-6 max-w-md text-center text-xs text-slate-400">
        Demo build: sign-in is simulated and no account data is stored.
      </p>
    </div>
  );
}
