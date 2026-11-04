/** Shapes returned by the backend e-commerce API (/api/ecommerce). */

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface ProductSummary {
  id: number;
  slug: string;
  sku: string;
  name: string;
  shortDescription: string | null;
  image: string | null;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  category: { id: number; name: string; slug: string };
  brand: { id: number; name: string; slug: string } | null;
  stockStatus: StockStatus;
  maxPurchasable: number;
  rating: { average: number; count: number };
  flags: { featured: boolean; bestSeller: boolean; newArrival: boolean; onOffer: boolean };
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  features: string[];
  specifications: { label: string; value: string }[];
  attributes: Record<string, string>;
  images: { url: string; alt: string }[];
  taxRate: number;
  warrantyInfo: string | null;
  deliveryInfo: string | null;
  maxOrderQty: number;
  seo: { title: string; description: string };
  breadcrumbs: { name: string; slug: string }[];
  variants: { slug: string; name: string; attributes: Record<string, string>; sellingPrice: number; stockStatus: StockStatus; current: boolean }[];
  related: ProductSummary[];
  updatedAt: string;
}

export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount: number;
  children: Category[];
  breadcrumbs?: { name: string; slug: string }[];
}

export interface Facets {
  brands: { slug: string; name: string; count: number }[];
  price: { min: number; max: number };
  specifications: { label: string; values: { value: string; count: number }[] }[];
}

export interface PageMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  pageCount?: number;
}

export interface ContentBlock {
  id: number;
  blockType: "banner" | "promo" | "testimonial" | "faq" | "trust_badge";
  title: string;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  authorName: string | null;
}

export interface PublicSettings {
  store: { name: string; supportEmail: string; supportPhone: string; address: string };
  shipping: { flatFee: number; freeShippingThreshold: number; estimatedDays: string };
  checkout: { guestCheckout: boolean; codEnabled: boolean };
  returns: { returnWindowDays: number };
  social: Record<"facebook" | "instagram" | "linkedin" | "youtube", string>;
}

export interface HomeContent {
  banners: ContentBlock[];
  promos: ContentBlock[];
  testimonials: ContentBlock[];
  faqs: ContentBlock[];
  trustBadges: ContentBlock[];
  categories: Category[];
  featured: ProductSummary[];
  bestSellers: ProductSummary[];
  newArrivals: ProductSummary[];
  offers: ProductSummary[];
  settings: PublicSettings;
}

export type CartIssue = "unavailable" | "out_of_stock" | "insufficient_stock" | "exceeds_limit";

export interface CartItem {
  id: number;
  productId: number;
  slug: string;
  sku: string;
  name: string;
  image: string | null;
  mrp: number;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  maxPurchasable: number;
  issue: CartIssue | null;
  issueMessage: string | null;
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  coupon: { code: string; description: string | null; discount: number } | null;
  couponError: string | null;
  freeShippingThreshold: number;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  couponCode: string | null;
  totals: Totals;
  canCheckout: boolean;
  availableCoupons: { code: string; description: string | null }[];
}

export interface CheckoutPreview extends Cart {
  serviceable: boolean | null;
  checkout: { guestCheckout: boolean; codEnabled: boolean; codMaxOrderValue: number; reservationMinutes: number; estimatedDelivery: string };
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  mobile: string;
}

export interface Address {
  id: number;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export type AddressInput = Omit<Address, "id" | "label" | "isDefaultShipping" | "isDefaultBilling" | "line2"> & { line2?: string };

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned"
  | "refunded";

export interface OrderListItem {
  orderNumber: string;
  placedAt: string;
  status: OrderStatus;
  statusLabel: string;
  paymentStatus: string;
  paymentMethod: "online" | "cod";
  total: number;
  itemCount: number;
  image: string | null;
}

export interface OrderHistoryEntry {
  fromStatus: string | null;
  toStatus: string;
  label: string;
  note: string | null;
  at: string;
}

export interface OrderDetail {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  paymentMethod: "online" | "cod";
  paymentStatus: string;
  payment: { reference: string | null; method: string | null; status: string } | null;
  placedAt: string;
  reservationExpiresAt: string | null;
  contact: { name: string; email: string; phone: string };
  shippingAddress: AddressInput;
  billingAddress: AddressInput;
  billingGstin: string | null;
  items: { id: number; slug: string | null; sku: string; name: string; image: string | null; unitPrice: number; mrp: number; quantity: number; lineTotal: number }[];
  totals: { subtotal: number; discount: number; shipping: number; tax: number; total: number; couponCode: string | null };
  tracking: { courier: string | null; number: string | null; url: string | null; shippedAt: string | null; deliveredAt: string | null };
  history: OrderHistoryEntry[];
  requests: { id: number; type: "cancellation" | "return"; reason: string; status: string; adminRemark: string | null; createdAt: string }[];
  refunds: { refundNumber: string; amount: number; reason: string; status: string; processedAt: string | null; createdAt: string }[];
  actions: { canPay: boolean; canCancel: boolean; canReturn: boolean; returnDeadline: string | null };
}

export interface PaymentSession {
  provider: "razorpay" | "mock";
  keyId: string | null;
  providerOrderId: string;
  amount: number;
  currency: string;
  orderNumber: string;
  prefill: { name: string; email: string; contact: string };
  expiresAt: string | null;
}

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  author: string;
  createdAt: string;
}
