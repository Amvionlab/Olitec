/**
 * MOCK DATA — Phase 1 only. Generated deterministically so every page load shows the same records.
 * Pages must not import this file directly; use src/services, which will call the backend API in Phase 2.
 */
import type { AdminUser, Customer, Product, Warranty, WarrantyStatus } from "@/lib/types";

/** Fixed "today" for the mock data so statuses stay consistent. */
export const MOCK_REFERENCE_DATE = new Date("2026-10-28T12:00:00+05:30");

export const mockAdmin: AdminUser = {
  id: "adm_01",
  name: "Anita Rao",
  email: "anita.rao@olitech.example",
  role: "Super Admin",
};

export const mockProducts: Product[] = [
  { id: "prd_101", name: "AquaPure RO+ Water Purifier", model: "AP-RO-750", category: "Water Purifier", warrantyMonths: 12 },
  { id: "prd_102", name: "PowerMax 1100 Sine Wave Inverter", model: "PM-1100-SW", category: "Inverter", warrantyMonths: 24 },
  { id: "prd_103", name: "LongLife 150Ah Tall Tubular Battery", model: "LL-TT-150", category: "Battery", warrantyMonths: 60 },
  { id: "prd_104", name: "BreezeCool 55L Desert Air Cooler", model: "BC-DC-55", category: "Air Cooler", warrantyMonths: 12 },
  { id: "prd_105", name: "AeroSilent BLDC Ceiling Fan", model: "AS-BLDC-1200", category: "Ceiling Fan", warrantyMonths: 36 },
  { id: "prd_106", name: "ChefPro 750W Mixer Grinder", model: "CP-MG-750", category: "Kitchen Appliance", warrantyMonths: 24 },
];

const people = [
  ["Priya", "Sharma"], ["Arjun", "Mehta"], ["Kavya", "Reddy"], ["Rahul", "Verma"], ["Sneha", "Iyer"],
  ["Vikram", "Singh"], ["Ananya", "Nair"], ["Rohit", "Kulkarni"], ["Meera", "Pillai"], ["Aditya", "Joshi"],
  ["Divya", "Menon"], ["Karthik", "Subramanian"], ["Pooja", "Desai"], ["Sanjay", "Patil"], ["Lakshmi", "Krishnan"],
  ["Nikhil", "Agarwal"], ["Fatima", "Sheikh"], ["Harish", "Gowda"], ["Neha", "Kapoor"], ["Suresh", "Babu"],
  ["Ishita", "Banerjee"], ["Manoj", "Tiwari"], ["Deepa", "Hegde"], ["Imran", "Khan"], ["Revathi", "Rao"],
  ["Gaurav", "Malhotra"], ["Swati", "Chatterjee"], ["Ajay", "Yadav"], ["Nandini", "Shetty"], ["Prakash", "Naidu"],
  ["Tanvi", "Bhat"], ["Joseph", "Thomas"],
] as const;

const cities = [
  ["Bengaluru", "Karnataka"], ["Mysuru", "Karnataka"], ["Chennai", "Tamil Nadu"], ["Hyderabad", "Telangana"],
  ["Pune", "Maharashtra"], ["Mumbai", "Maharashtra"], ["Kochi", "Kerala"], ["Coimbatore", "Tamil Nadu"],
] as const;

const dealers = [
  "Sri Lakshmi Electronics", "PowerZone Batteries", "Cool Home Appliances", "Reliance Digital", "Online purchase",
  "Vijay Sales", "Home Needs Store",
];

const rejectionRemarks = [
  "Invoice image is unreadable. Please upload a clearer copy.",
  "Serial number on the invoice does not match the serial number entered.",
  "Purchase was made from an unauthorised seller.",
];

const reviewers = ["Anita Rao", "Mohan Das"];

/** Small seeded PRNG (mulberry32) so the generated data is stable. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20261028);
const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];
const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const mockCustomers: Customer[] = people.map(([first, last], index) => {
  const [city, state] = pick(cities);
  return {
    id: `cus_${2001 + index}`,
    name: `${first} ${last}`,
    email: `${first}.${last}@example.com`.toLowerCase(),
    mobile: `${pick(["9", "8", "7"])}${String(int(100000000, 999999999))}`,
    city,
    state,
    status: index % 11 === 7 ? "Inactive" : "Active",
    registeredAt: addDays(MOCK_REFERENCE_DATE, -int(20, 1100)).toISOString(),
  };
});

function buildWarranty(customer: Customer, sequence: number): Warranty {
  const product = pick(mockProducts);
  // Every sixth record is a recent submission so the review queue has realistic volume.
  const recent = sequence % 6 === 0;
  const purchase = addDays(MOCK_REFERENCE_DATE, -(recent ? int(3, 20) : int(2, 1000)));
  const submitted = new Date(Math.min(addDays(purchase, int(0, 6)).getTime(), MOCK_REFERENCE_DATE.getTime()));
  const ageInDays = (MOCK_REFERENCE_DATE.getTime() - submitted.getTime()) / 86_400_000;
  const end = addDays(addMonths(purchase, product.warrantyMonths), -1);
  const reviewedAt = addDays(submitted, int(1, 2));
  const reviewer = pick(reviewers);

  let status: WarrantyStatus;
  if (recent || ageInDays < 12 || (ageInDays < 40 && random() < 0.3)) status = "Pending";
  else if (random() < 0.1) status = "Rejected";
  else status = end > MOCK_REFERENCE_DATE ? "Active" : "Expired";

  const remark = status === "Rejected" ? pick(rejectionRemarks) : undefined;
  const history: Warranty["history"] = [{ at: submitted.toISOString(), action: "Registration submitted", by: customer.name }];
  if (status === "Active" || status === "Expired") history.push({ at: reviewedAt.toISOString(), action: "Approved", by: reviewer });
  if (status === "Rejected") history.push({ at: reviewedAt.toISOString(), action: "Rejected", by: reviewer, remark });
  if (status === "Expired") history.push({ at: addDays(end, 1).toISOString(), action: "Expired automatically", by: "System" });

  const approved = status === "Active" || status === "Expired";
  return {
    id: `war_${5000 + sequence}`,
    warrantyNumber: `WR-${submitted.getFullYear()}-${String(1000 + sequence * 37).padStart(6, "0")}`,
    customerId: customer.id,
    productId: product.id,
    serialNumber: `${product.model.replace(/-/g, "")}${int(10000000, 99999999)}`,
    purchaseDate: isoDate(purchase),
    invoiceNumber: `INV/${customer.city.slice(0, 3).toUpperCase()}/${purchase.getFullYear()}/${int(10000, 99999)}`,
    invoiceFileName: `invoice-${int(1000, 9999)}.${pick(["pdf", "jpg", "png"])}`,
    dealerName: pick(dealers),
    startDate: approved ? isoDate(purchase) : null,
    endDate: approved ? isoDate(end) : null,
    status,
    submittedAt: submitted.toISOString(),
    remark,
    history,
  };
}

let sequence = 1;
export const mockWarranties: Warranty[] = mockCustomers
  .flatMap((customer) => Array.from({ length: int(1, 3) }, () => buildWarranty(customer, sequence++)))
  .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
