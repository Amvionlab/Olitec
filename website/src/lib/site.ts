export const siteConfig = {
  name: "OLITEC",
  // Tagline and description from the Olitec HTML design.
  tagline: "Building a dependable clean-energy model for India.",
  description:
    "Olitec is an Indian clean-energy company built to meet the country's growing need for power that is clean, reliable and of consistent quality.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportPhone: "0478 793 1519",
  /** Customer care numbers from the Olitec HTML design. */
  carePhones: ["+91 98433 31543", "+91 98406 44034"],
  legalName: "Olitec Solar Private Limited",
  supportEmail: "contact@olitec.in",
  supportHours: "Mon–Sat, 9:00 AM – 6:00 PM",
  factoryAddress: "127/2,Vallimalai ring road Perumalkuppam, Taluk, Katpadi, Vellore, Tamil Nadu 632520",
  corporateAddress: "5/63, Gateway house, House of Hiranandani, Egattur, OMR. Chennai 600130.",
  /** Add the real profile URLs to show the footer icons as links. Empty values render as plain icons. */
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
  },
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

/** Header navigation — the menu of the Olitec HTML design, with its two dropdowns. */
export const mainNav: readonly NavItem[] = [
  { href: "/", label: "Our Legacy", match: ["/leadership"] },
  { href: "/products", label: "Products" },
  { href: "/applications", label: "Applications" },
  { href: "/downloads", label: "Downloads" },
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
      { href: "/channel-partners", label: "For channel partners", description: "Distributors, dealers and installers" },
      { href: "/homes-and-businesses", label: "For homes and businesses", description: "Plan a system and find an installer" },
      { href: "/careers", label: "Careers", description: "Build India's energy infrastructure with us" },
    ],
  },
];

/** Footer link groups, as in the Olitec HTML design footer. */
export const footerColumns = [
  {
    title: "Products",
    links: [
      { href: "/products", label: "Hybrid inverters" },
      { href: "/products", label: "Energy storage" },
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
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/", label: "Our Legacy" },
      { href: "/leadership", label: "Leadership" },
      { href: "/channel-partners", label: "Channel partners" },
      { href: "/homes-and-businesses", label: "Homes and businesses" },
      { href: "/careers", label: "Careers" },
    ],
  },
] as const;
