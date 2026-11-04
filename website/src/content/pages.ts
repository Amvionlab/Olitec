/**
 * Copy for the inner pages, taken word for word from the Olitec HTML design
 * (products, applications, downloads, customer care and connect pages).
 */
import { siteConfig } from "@/lib/site";

export const companyContact = {
  legalName: siteConfig.legalName,
  addressLines: ["No. 5/63, Gateway House, House of Hiranandani,", "Egattur, OMR, Chennai 600 130"],
  phones: siteConfig.carePhones,
};

export const customerCareNav = [
  { href: "/warranties/register", label: "Register your warranty" },
  { href: "/warranty-status", label: "Check warranty status" },
  { href: "/service-request", label: "Raise a service request" },
] as const;

export const connectNav = [
  { href: "/channel-partners", label: "For channel partners" },
  { href: "/homes-and-businesses", label: "For homes and businesses" },
  { href: "/careers", label: "Careers" },
] as const;

export const downloadFiles = {
  inverterDatasheet: "/downloads/olitec-hybrid-inverter-datasheet.pdf",
  inverterDatasheetText: "/downloads/olitec-hybrid-inverter-datasheet-text.pdf",
  batteryDatasheet: "/downloads/olitec-lfp-battery-datasheet.pdf",
  batteryDatasheetText: "/downloads/olitec-lfp-battery-datasheet-text.pdf",
  brochure: "/downloads/olitec-energy-storage-brochure.pdf",
};

/* ------------------------------------------------------------------ Products */

export const productsPage = {
  eyebrow: "Products",
  title: "Inverters and energy storage, engineered to work together",
  lead: "Olitec hybrid inverters and lithium iron phosphate batteries are designed as one system: solar, storage and backup managed by a single intelligent platform, for homes, businesses and industry.",
  series: [
    {
      icon: "bolt",
      tone: "orange",
      eyebrow: "Single-phase hybrid inverter",
      title: "OLI-1H series, 3 to 6 kW",
      tagline: "Solar, storage and backup in one compact unit",
      body: "Built for homes, shops, clinics and offices on single-phase supply. The OLI-1H runs your loads from solar first, stores the surplus in a 48 V battery and switches to backup in under 10 milliseconds when the grid fails.",
      bullets: [
        "Up to 6 units in parallel, scaling to 36 kW",
        "Six-period time-of-use scheduling and peak shaving",
        "Works with lithium or lead-acid batteries; plug-and-play with Olitec OLB packs",
        "Fan-less, quiet operation below 35 dB",
      ],
      models: ["OLI-1H3L", "OLI-1H3.6L", "OLI-1H4L", "OLI-1H4.6L", "OLI-1H5L", "OLI-1H6L", "OLI-1H5L-2"],
      datasheet: downloadFiles.inverterDatasheet,
      figures: [
        { label: "Rated output", value: "3 to 6 kW" },
        { label: "Max. PV input", value: "up to 200 %" },
        { label: "MPPTs", value: "2" },
        { label: "Battery voltage", value: "40 to 60 V" },
        { label: "Backup switch-over", value: "< 10 ms" },
        { label: "Peak efficiency", value: "97.3 %" },
        { label: "Protection", value: "IP66" },
      ],
    },
    {
      icon: "factory",
      tone: "orange",
      eyebrow: "Three-phase hybrid inverter",
      title: "OLI-3H series, 15 to 30 kW",
      tagline: "Commercial-grade hybrid power for three-phase sites",
      body: "For schools, hospitals, factories, offices and retail. Up to 60 kW of PV input, dual high-voltage battery ports and full three-phase backup, with fully unbalanced output for real-world loads.",
      bullets: [
        "100 % unbalanced output on each phase",
        "AC coupling and diesel generator integration",
        "Peak shaving and demand management",
        "Up to 6 units in parallel",
      ],
      models: ["OLI-3H15H", "OLI-3H20H", "OLI-3H25H", "OLI-3H29.9H", "OLI-3H30H"],
      datasheet: downloadFiles.inverterDatasheet,
      figures: [
        { label: "Rated output", value: "15 to 30 kW" },
        { label: "Max. PV input", value: "up to 60 kW" },
        { label: "MPPTs", value: "2 to 3" },
        { label: "Battery voltage", value: "160 to 750 V" },
        { label: "Backup switch-over", value: "< 10 ms" },
        { label: "Peak efficiency", value: "97.8 %" },
        { label: "Protection", value: "IP66" },
      ],
    },
    {
      icon: "battery",
      tone: "green",
      eyebrow: "LFP battery storage",
      title: "OLB-5.12 series, 5.12 kWh",
      tagline: "Safe, long-life storage that grows with you",
      body: "Lithium iron phosphate packs at 51.2 V and 100 Ah, available wall-mount or 19-inch rack-mount. Start with one pack and add more in parallel as demand grows, up to 51.2 kWh.",
      bullets: [
        "Cobalt-free LiFePO₄ cells certified to BIS, UN 38.3, IEC 62619 and UL 1973",
        "Intelligent BMS with cell-level protection",
        "Passive cooling with no fans to maintain",
        "Wall-mount or 3U rack-mount formats",
      ],
      models: ["OLB-5.12W", "OLB-5.12R"],
      datasheet: downloadFiles.batteryDatasheet,
      figures: [
        { label: "Energy per pack", value: "5.12 kWh" },
        { label: "Nominal voltage", value: "51.2 V" },
        { label: "Max. current", value: "100 A" },
        { label: "Cycle life", value: "4,000 at 80 % DoD" },
        { label: "Parallel packs", value: "up to 10" },
        { label: "Communication", value: "RS485, CAN, RS232" },
      ],
    },
  ],
  platform: {
    title: "One platform, from a home to a plant",
    lead: "Every Olitec product is designed to work with the others, and with the solar plants we build.",
    steps: [
      { icon: "sun", title: "Generate", body: "Solar arrays feed the hybrid inverter through high-efficiency MPPT trackers." },
      { icon: "battery", title: "Store", body: "Surplus energy charges Olitec LFP batteries, managed over CAN by the inverter." },
      { icon: "bolt", title: "Protect", body: "Loads move to backup in under 10 ms when the grid fails, with no interruption." },
      { icon: "chart", title: "Optimise", body: "Time-of-use schedules and app monitoring keep running costs low." },
    ],
  },
} as const;

/** Model numbers grouped as in the service-request form. */
export const productModelGroups = [
  { label: "Single-phase hybrid inverters (OLI-1H)", options: productsPage.series[0].models },
  { label: "Three-phase hybrid inverters (OLI-3H)", options: productsPage.series[1].models },
  { label: "LFP batteries (OLB-5.12)", options: productsPage.series[2].models },
];

/* -------------------------------------------------------------- Applications */

export const applicationsPage = {
  eyebrow: "Applications",
  title: "Built for the places India needs power most",
  lead: "From a family home to a forward post in the mountains, Olitec systems combine solar, storage and generator backup into dependable power. Explore how they are applied.",
  items: [
    {
      id: "homes",
      icon: "home",
      title: "Homes and small businesses",
      tagline: "Uninterrupted power for everyday life",
      challenge:
        "Frequent outages, voltage swings and rising tariffs make grid-only supply unreliable and expensive for homes, shops and clinics.",
      system: [
        "OLI-1H single-phase hybrid inverter, 3 to 6 kW",
        "One to four OLB-5.12 battery packs",
        "Solar array sized up to 200 % of inverter rating",
      ],
      outcome: [
        "Essential loads stay on through outages, with switch-over in under 10 ms",
        "Solar powers the day and stored energy covers the evening peak",
        "Monitoring and scheduling from a mobile app",
      ],
    },
    {
      id: "remote",
      icon: "pin",
      title: "Remote locations and off-grid sites",
      tagline: "Reliable power where the grid does not reach",
      challenge:
        "Farms, borewell pumps, eco-resorts, quarries and construction camps often depend on a diesel generator that is costly to run and to refuel.",
      system: [
        "OLI-1H or OLI-3H hybrid inverter, matched to the load",
        "OLB-5.12 storage sized for overnight and cloudy-day autonomy",
        "Diesel generator retained as a backup source",
      ],
      outcome: [
        "Solar and storage carry the daily load; the generator runs only when needed",
        "Lower fuel use, fewer refuelling trips and quieter sites",
        "Remote monitoring reduces visits by service teams",
      ],
    },
    {
      id: "mobile",
      icon: "van",
      title: "Camper vans and mobile power",
      tagline: "Solar, battery and generator in one compact system",
      challenge:
        "Camper vans, mobile clinics, broadcast vans and outdoor event units need silent, clean power on the move and at remote halts.",
      system: [
        "Compact OLI-1H hybrid inverter, 3 to 3.6 kW",
        "OLB-5.12R rack-mount batteries in a ventilated compartment",
        "Roof-mounted solar panels with a portable generator or shore supply as backup",
      ],
      outcome: [
        "Silent power for appliances, lighting and equipment while parked",
        "Solar recharges the battery during the day; the generator tops up only when required",
        "Shore power from a campsite or depot charges the system automatically",
      ],
    },
    {
      id: "defence",
      icon: "shield",
      title: "Defence and border installations",
      tagline: "Resilient power for critical outposts",
      challenge:
        "Forward posts, border outposts and surveillance stations need dependable power in harsh climates, with minimal fuel logistics and maintenance.",
      system: [
        "OLI-1H or OLI-3H hybrid inverters, IP66 rated for outdoor mounting",
        "OLB-5.12 storage installed in a protected shelter",
        "Solar array with diesel generator integration",
      ],
      outcome: [
        "Continuous power for communications, surveillance and living quarters",
        "Reduced dependence on fuel convoys to remote locations",
        "Wide operating temperature range from minus 20 to 60 °C on the inverter",
      ],
    },
    {
      id: "microgrid",
      icon: "mountain",
      title: "Microgrids for hill and remote settlements",
      tagline: "Community power for villages beyond the grid",
      challenge:
        "Hill hamlets, island communities and remote settlements are often served by long, unreliable feeder lines or by no grid at all.",
      system: [
        "Three-phase OLI-3H hybrid inverters in parallel, up to 180 kW",
        "Battery bank sized for community night-time demand",
        "Ground-mount solar plant with optional generator backup",
      ],
      outcome: [
        "Round-the-clock power for homes, schools, health centres and small enterprises",
        "Local generation removes the losses and faults of long feeder lines",
        "A system that can grow as the settlement grows",
      ],
    },
    {
      id: "ci",
      icon: "factory",
      title: "Commercial and industrial sites",
      tagline: "Lower demand charges and protected operations",
      challenge:
        "Factories, hospitals, cold stores and commercial buildings face peak demand charges and costly downtime when the supply fails.",
      system: [
        "OLI-3H three-phase hybrid inverters, 15 to 30 kW each",
        "High-voltage battery storage",
        "Rooftop or ground-mount solar with generator integration",
      ],
      outcome: [
        "Peak shaving to stay within contracted demand",
        "Critical equipment protected through outages",
        "Reduced generator run hours and fuel costs",
      ],
    },
  ],
  cta: {
    title: "Have an application in mind?",
    body: "Tell us about your site and load, and our engineers will recommend a system configuration.",
    action: { href: "/homes-and-businesses", label: "Talk to our engineers" },
  },
} as const;

/* ----------------------------------------------------------------- Downloads */

export const downloadsPage = {
  eyebrow: "Downloads",
  title: "Datasheets and brochures",
  lead: "Technical documentation for Olitec hybrid inverters and energy storage systems. All files are PDF.",
  groups: [
    {
      title: "Datasheets",
      files: [
        {
          title: "Hybrid inverter datasheet",
          description: "OLI-1H single-phase 3 to 6 kW and OLI-3H three-phase 15 to 30 kW",
          size: "PDF · 0.7 MB",
          href: downloadFiles.inverterDatasheet,
        },
        {
          title: "Hybrid inverter datasheet, text edition",
          description: "The same specifications in a print-friendly format without images",
          size: "PDF · 0.3 MB",
          href: downloadFiles.inverterDatasheetText,
        },
        {
          title: "LFP battery datasheet",
          description: "OLB-5.12 wall-mount and rack-mount 5.12 kWh packs",
          size: "PDF · 0.5 MB",
          href: downloadFiles.batteryDatasheet,
        },
        {
          title: "LFP battery datasheet, text edition",
          description: "The same specifications in a print-friendly format without images",
          size: "PDF · 0.3 MB",
          href: downloadFiles.batteryDatasheetText,
        },
      ],
    },
    {
      title: "Brochures",
      files: [
        {
          title: "Energy storage solutions brochure",
          description: "The complete Olitec inverter and battery range with applications and specifications",
          size: "PDF · 1.9 MB",
          href: downloadFiles.brochure,
        },
      ],
    },
  ],
  restricted: {
    title: "Installation manuals and certificates",
    body: "Installation manuals, test certificates and compliance documents are shared with our channel partners and on request for project tenders.",
    actions: [
      { href: "/channel-partners", label: "Partner access", primary: true },
      { href: "/homes-and-businesses", label: "Request a document", primary: false },
    ],
  },
};

/* ------------------------------------------------------------- Customer care */

export const warrantyRegistrationHero = {
  eyebrow: "Olitec Warranty Support",
  title: "Warranty Registration",
  lead: "Register your solar product to submit your warranty details.",
};

export const warrantyStatusPage = {
  eyebrow: "Customer Care",
  title: "Check your warranty status",
  lead: "Enter your product serial number and registered mobile number to see your warranty cover.",
  serialHint: "Printed on the product label and on your warranty card",
  notRegistered: { href: "/warranties/register", label: "Not registered yet?" },
};

export const serviceRequestPage = {
  eyebrow: "Customer Care",
  title: "Raise a service request",
  lead: "Report a problem with your Olitec product and our service team will get back to you.",
  nextSteps: [
    "You receive a ticket number by SMS.",
    "Our team calls to diagnose the issue remotely.",
    "If needed, a technician visits on your preferred date.",
    "We confirm closure once the issue is resolved.",
  ],
};

/* ------------------------------------------------------------------- Connect */

export const channelPartnersPage = {
  eyebrow: "Connect",
  title: "Grow with Olitec as a channel partner",
  lead: "We work with distributors, dealers, installers and EPC companies across India to bring dependable solar and storage to more customers.",
  partnerTypes: [
    { icon: "people", title: "Distributors", body: "Regional stock and supply for dealers and installers in your territory." },
    { icon: "home", title: "Dealers and retailers", body: "Sell Olitec inverters and batteries to homes and businesses." },
    { icon: "wrench", title: "Installers", body: "Design and install Olitec systems with our technical backing." },
    { icon: "factory", title: "EPC companies", body: "Specify Olitec products on commercial, industrial and institutional projects." },
  ],
  benefits: [
    { title: "Products built to last", body: "A focused range of hybrid inverters and LFP batteries designed to work together, with fewer service calls." },
    { title: "Technical support", body: "System design help, product training and commissioning support from our engineering team." },
    { title: "Marketing support", body: "Datasheets, brochures, product samples and co-branded material for your customers." },
    { title: "Service backing", body: "Warranty handling and replacement support so your customers are never left waiting." },
  ],
  steps: [
    "Share your details using the form below.",
    "Our channel team calls to understand your business and territory.",
    "We agree terms, pricing and onboarding.",
    "You receive training, samples and marketing material, and start selling.",
  ],
} as const;

export const homesPage = {
  eyebrow: "Connect",
  title: "Power for your home or business",
  lead: "Whether you want backup during outages, lower electricity bills or power where the grid does not reach, we will help you plan the right Olitec system.",
  steps: [
    { icon: "phone", title: "Tell us your needs", body: "Share your location, loads and goals using the form below." },
    { icon: "chart", title: "Get a recommendation", body: "Our engineers suggest an inverter, battery and solar size for your site." },
    { icon: "wrench", title: "Professional installation", body: "An authorised Olitec partner near you installs and commissions the system." },
    { icon: "shield", title: "Ongoing support", body: "Register your warranty and reach our service team whenever you need us." },
  ],
} as const;

export const careersPage = {
  eyebrow: "Connect",
  title: "Build India's energy infrastructure with us",
  lead: "At Olitec, engineers, technicians and business teams work on products and plants that keep the lights on for homes, industry and communities across the country.",
  areasTitle: "Where you can work",
  areasLead: "We grow our talent from within, and give people real responsibility early.",
  areas: [
    { icon: "chip", title: "Research and development", body: "Power electronics, embedded firmware, battery management and product validation." },
    { icon: "factory", title: "Manufacturing and quality", body: "Production, testing, process engineering and quality assurance." },
    { icon: "sun", title: "Project engineering", body: "Design, execution and commissioning of large-scale solar plants." },
    { icon: "people", title: "Sales and channel", body: "Building and supporting our distributor, dealer and installer network." },
    { icon: "wrench", title: "Service and support", body: "Field service, remote diagnostics and customer care." },
    { icon: "graduate", title: "Graduate programme", body: "Structured training for fresh engineers and diploma holders." },
  ],
  why: [
    "Work on products and projects that matter for the country",
    "Learn from leaders with decades of manufacturing and energy experience",
    "Training and mentoring from your first day",
    "A culture of ownership, rigour and honest communication",
  ],
  openings: "We do not always advertise every opening. Send us your resume and we will contact you when a suitable role comes up.",
} as const;
