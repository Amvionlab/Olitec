import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getCategories, getSettings, listPages } from "@/services/catalog";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // The shell must render even if the API is briefly unavailable; pages show their own errors.
  const [categories, settings, pages] = await Promise.all([getCategories().catch(() => []), getSettings().catch(() => null), listPages()]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Skip to content
      </a>
      <Header categories={categories} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer settings={settings} categories={categories} pages={pages} />
    </>
  );
}
