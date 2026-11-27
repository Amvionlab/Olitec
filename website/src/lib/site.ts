export const siteConfig = {
  name: "OLITEC",
  tagline: "Building a dependable clean-energy model for India.",
  description:
    "Olitec is an Indian clean-energy company built to meet the country's growing need for power that is clean, reliable and of consistent quality.",
  searchDescription:
    "Hybrid inverters and energy storage, designed as one system and supported through our partner network.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** The only phone number across the whole website: 8501 800 800 (Item 4) */
  supportPhone: "8501 800 800",
  carePhones: ["8501 800 800"],
  legalName: "Olitec Solar Private Limited",
  supportEmail: "contact@olitec.in",
  factoryAddress:
    "No. 127/2, Vallimalai Ring Road, Perumalkuppam, Katpadi Taluk, Vellore, Tamil Nadu 632 520",
  corporateAddress:
    "No. 5/63, Gateway House, House of Hiranandani, Egattur, OMR, Chennai, Tamil Nadu 600 130",
};

export interface NavChild {
  href: string;
  label: string;
  description: string;
}

export interface NavItem {
  href: string;
  label: string;
  /** Extra paths that mark this item as the current section. */
  match?: readonly string[];
  children?: readonly NavChild[];
}

/** Header navigation — new menu bar order (Item M18 & Item 10) */
export const mainNav: readonly NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/leadership", label: "Our Legacy", match: ["/leadership"] },
  { href: "/products", label: "Products" },
  { href: "/applications", label: "Applications" },
  { href: "/downloads", label: "Downloads" },
  { href: "/media", label: "Media" },
  {
    href: "/warranties/register",
    label: "Customer Care",
    children: [
      { href: "/warranties/register", label: "Register your warranty", description: "Activate cover for a new Olitec product" },
      { href: "/warranty-status", label: "Check warranty status", description: "Look up cover by serial number" },
      { href: "/service-request", label: "Raise a service request", description: "Report an issue and book a technician" },
    ],
  },
  {
    href: "/channel-partners",
    label: "Connect",
    children: [
      { href: "/channel-partners", label: "For channel partners", description: "Distributors and EPC integrators" },
      { href: "/homes-and-businesses", label: "For homes and businesses", description: "Plan a system for your site" },
      { href: "/careers", label: "Careers", description: "Build India's energy infrastructure with us" },
    ],
  },
];

/** Footer link groups with Home and Media added (Item M8) */
export const footerColumns = [
 {
  title: "Products",
  links: [
    {
      href: "/products/oli-1h-series-3-6kw",
      label: "Single-phase hybrid inverter (OLI-1H)",
    },
    {
      href: "/products/oli-3h-series-15-30kw",
      label: "Three-phase hybrid inverter (OLI-3H)",
    },
    {
      href: "/products/olb-512-lfp-battery-wall",
      label: "Energy storage (OLB-5.12)",
    },
    { href: "/applications", label: "Applications" },
    { href: "/downloads", label: "Downloads" },
  ],
},
  {
    title: "Customer Care",
    links: [
      { href: "/warranties/register", label: "Register warranty" },
      { href: "/warranty-status", label: "Warranty status" },
      { href: "/service-request", label: "Service request" },
      { href: "/login", label: "Portal Login" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/", label: "Home" },
      { href: "/leadership", label: "Our Legacy" },
      { href: "/media", label: "Media" },
      { href: "/channel-partners", label: "Channel partners" },
      { href: "/homes-and-businesses", label: "Homes and businesses" },
      { href: "/careers", label: "Careers" },
    ],
  },
] as const;
