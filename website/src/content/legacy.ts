/**
 * Home page ("Our Legacy") and Leadership copy, taken word for word from the Olitec HTML design
 * (Olitec-Website/index.html and leadership.html). Images live in public/images/legacy/.
 */

export const legacyHero = {
  title: "Building a dependable clean-energy model for India",
  /** The title split for the Figma hero: white lines, then the orange accent line. */
  titleLines: ["Building a dependable", "clean-energy model"],
  titleAccent: "for India",
  cta: { href: "/products", label: "Explore our products" },
  card: { href: "/#services", label: "Three connected lines of business", image: "/images/legacy/ground-mount-epc.jpg" },
  image: "/images/legacy/hero.jpg",
  imageAlt:
    "Illustration of a sunrise over rows of solar arrays feeding an inverter, battery storage and transmission towers toward a city skyline",
};

export const legacyLead = {
  statement:
    "Olitec is an Indian clean-energy company built to meet the country's growing need for power that is clean, reliable and of consistent quality.",
  paragraphs: [
    "We design and deliver our own inverters and energy storage systems. We build ground-mount solar plants under the open-access framework, and we take complete turnkey responsibility for every system we supply. As one company, we remain accountable from engineering through to performance.",
    "Olitec draws on decades of manufacturing experience, as its promoters built Butterfly into one of India's most trusted household brands. Its strength is further reinforced by a team that has spent years generating, storing and delivering energy in Indian conditions.",
  ],
};

export const businessLinesIntro = {
  title: "What Olitec does",
  subtitle: "Olitec operates across three connected lines of business:",
};

export const businessLines = [
  {
    key: "epc",
    title: "Ground-mount open-access EPC",
    body: "Engineering, procuring and constructing ground-mount solar plants under the open-access framework, so that commercial and industrial consumers can source clean power at scale from plants built to last.",
    image: "/images/legacy/ground-mount-epc.jpg",
    imageAlt:
      "Illustration of ground-mounted solar tables feeding a substation and transmission towers toward a factory on the horizon",
    overlay: "groundMount",
  },
  {
    key: "storage",
    title: "Inverters and energy storage",
    body: "Delivering state-of-the-art hybrid inverters and battery energy storage systems under the Olitec brand — developed through in-house R&D, built to manufacturing-grade quality and supported through our partner network across India.",
    image: "/images/legacy/inverters-storage.jpg",
    imageAlt:
      "Illustration of a wall-mounted inverter and battery turning a rough waveform into clean power for lights, appliances and the grid",
    overlay: "inverters",
  },
  {
    key: "turnkey",
    title: "Turnkey solutions",
    body: "Taking full responsibility for a customer's energy system — design, supply, installation, commissioning and performance — so that one accountable team delivers the outcome, not just the equipment.",
    image: "/images/legacy/turnkey.jpg",
    imageAlt:
      "Illustration of a circle completed from three segments, with design, supply, installation, commissioning and performance stages around one centre",
    overlay: "turnkey",
  },
] as const;

export const synergy = {
  statement:
    "Each line of business strengthens the others: what we learn operating plants shapes the products we build, and the products we build make the solutions we deliver more reliable.",
  image: "/images/legacy/synergy.jpg",
  imageAlt: "Three linked nodes representing solar plants, inverters and storage, and turnkey delivery",
};

export const values = {
  title: "At Olitec, our values are at the core of how we work.",
  image: "/images/legacy/values.jpg",
  imageAlt: "Abstract contour lines radiating from a single point",
  paragraphs: [
    "Olitec is led by engineers, builders and manufacturers with deep experience in power electronics, energy storage, solar generation and industrial production — people who have built factories, commissioned power plants and put products into millions of Indian homes.",
    "We value engineering rigour, accountability and plain, honest communication. Ours is a culture of ownership and long-term thinking: we design for the conditions a system will actually face, we test as if our name depends on it, and we judge ourselves by whether what we deliver performs as designed, year after year.",
    "We grow our talent from within — training engineers and technicians in India, for India — because the capability to build the country's energy infrastructure should be built here as well.",
  ],
  link: { href: "/leadership", label: "Meet the leadership team →" },
};

export const leadershipIntro =
  "Olitec is led by people who have built manufacturing businesses, raised and managed capital, and designed and delivered energy systems across India.";

/** `tone` picks the initials badge colours used in the design (orange, green or neutral). */
export const leaders = [
  {
    initials: "VV",
    name: "VMG Viswanathan",
    tone: "orange",
    paragraphs: [
      "VMG Viswanathan is a fourth-generation industrialist with more than twenty years of leadership experience at Butterfly Gandhimathi Appliances Ltd and Unlimitive LLP. He is known for his expertise in strategic material sourcing and for introducing innovative production technologies.",
      "He holds a Master of Engineering from AVIT University and has completed advanced management education at IIM Ahmedabad.",
    ],
  },
  {
    initials: "VM",
    name: "V.M.G. Mayuresan",
    tone: "orange",
    paragraphs: [
      "V.M.G. Mayuresan brings more than fifteen years of experience in corporate strategy, investor relations, finance and accounts, and has led renowned organisations including Butterfly Gandhimathi Appliances Ltd.",
      "He has secured significant investments, managed investor relations and established robust, debt-free financial systems. He holds a B.Tech and an MBA.",
    ],
  },
  {
    initials: "MV",
    name: "Magesh Vasudevan",
    tone: "green",
    paragraphs: [
      "Magesh Vasudevan has a decade of experience in the solar industry. He established Olitec's state-of-the-art PV module manufacturing facility and leads the company's innovative projects in distributed energy generation and storage.",
      "His expertise and drive for sustainable energy solutions have significantly advanced the organisation's capabilities.",
    ],
  },
  {
    initials: "VV",
    name: "Vivek Vasudevan",
    tone: "green",
    paragraphs: [
      "Vivek Vasudevan leads the design and execution of Olitec's solar power plants. With a master's degree in energy and environment, he specialises in optimising solar systems and developing efficient models for solar power generation.",
      "His work in photovoltaic and solar thermal applications has significantly enhanced overall system performance.",
    ],
  },
  {
    initials: "SS",
    name: "Sandeep Sharma",
    tone: "neutral",
    paragraphs: [
      "Sandeep Sharma has more than thirty years of experience with brands such as Future Group and Bajaj Electricals. He excels in vendor and product management, techno-commercial sourcing and business growth.",
      "His entrepreneurial mindset and customer-centric approach make him a valuable asset to the organisation.",
    ],
  },
] as const;
