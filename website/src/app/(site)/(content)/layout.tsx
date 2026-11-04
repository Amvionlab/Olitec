/** Inner pages (products, warranties, support, profile) get standard spacing on the Figma white canvas. */
export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-white pb-20 pt-6 xl:pt-10">{children}</div>;
}
