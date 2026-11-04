import Image from "next/image";
import Link from "next/link";
import { footerColumns, siteConfig } from "@/lib/site";

const socials = [
  { key: "facebook", label: "Facebook", icon: "/images/home/icons/facebook.svg" },
  { key: "instagram", label: "Instagram", icon: "/images/home/icons/instagram.svg" },
  { key: "linkedin", label: "LinkedIn", icon: "/images/home/icons/linkedin.svg" },
  { key: "youtube", label: "YouTube", icon: "/images/home/icons/youtube.svg" },
] as const;

const heading = "text-[16.867px] font-medium leading-[25.3px] text-brand-500";
const body = "text-[16.867px] font-medium leading-[25.3px] text-muted";

const tel = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

export function SiteFooter() {
  return (
    <footer className="bg-[rgb(157_157_157/0.08)]">
      <div className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-8 xl:px-[105px] xl:pt-[43px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.25fr_1fr_1fr_1fr_1.35fr] xl:gap-x-8">
          <div>
            <Image src="/images/home/olitec-logo.png" alt={siteConfig.name} width={223} height={67} className="h-[66.9px] w-[223px]" />
            <p className="mt-[18px] max-w-[292px] text-base font-medium leading-6 text-muted">{siteConfig.tagline}</p>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className={heading}>{column.title}</p>
              <ul className="mt-[21px] space-y-[16.7px]">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={`${body} hover:text-brand-600`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className={heading}>Contact</p>
            <a href={`mailto:${siteConfig.supportEmail}`} className={`${body} mt-[21px] block hover:text-brand-600`}>
              {siteConfig.supportEmail}
            </a>
            {[siteConfig.supportPhone, ...siteConfig.carePhones].map((phone) => (
              <a key={phone} href={tel(phone)} className={`${body} mt-2 block hover:text-brand-600`}>
                {phone}
              </a>
            ))}
            <p className={`${body} mt-[26px] font-semibold`}>Factory Address</p>
            <p className={`${body} mt-[3.3px] max-w-[268px]`}>{siteConfig.factoryAddress}</p>
            <p className={`${body} mt-[26px] font-semibold`}>Corporate Address</p>
            <p className={`${body} mt-[3.7px] max-w-[268px]`}>
              {siteConfig.legalName}
              <br />
              {siteConfig.corporateAddress}
            </p>
          </div>
        </div>

        <div className="mt-10 h-[2.1px] rounded-full bg-[#f2ab44] xl:mt-[49px]" />

        <div className="flex flex-col-reverse gap-4 py-5 sm:flex-row sm:items-center sm:justify-between xl:pb-[25px] xl:pt-[21px]">
          <div className="flex gap-[12.65px]">
            {socials.map(({ key, label, icon }) => {
              const href = siteConfig.social[key];
              const img = <Image src={icon} alt={href ? "" : label} width={34} height={34} className="size-[33.73px]" />;
              return href ? (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  {img}
                </a>
              ) : (
                <span key={key}>{img}</span>
              );
            })}
          </div>
          <p className="font-nav text-[16.867px] font-semibold leading-[25.3px] text-[#b0b0b0]">
            © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
