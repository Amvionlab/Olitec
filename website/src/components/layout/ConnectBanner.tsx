import { SlimPageBanner } from "./SlimPageBanner";
import { ConnectTabs } from "@/components/connect/ConnectPage";

/** Item M13: slim two-line banner (M16), then the three tab links beneath it. */
export function ConnectBanner({ current }: { current: "/channel-partners" | "/homes-and-businesses" | "/careers" }) {
  return (
    <>
      <SlimPageBanner
        title="Connect with Olitec"
        accentWords="with Olitec"
        lead="Partner with us, plan a system for your site, or build your career."
      />
      <ConnectTabs current={current} />
    </>
  );
}
