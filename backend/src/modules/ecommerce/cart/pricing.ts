/**
 * Order pricing. Selling prices are GST-inclusive, so:
 *   subtotal       = Σ unit price × qty
 *   discount       = coupon discount (spread over eligible lines in proportion to their value)
 *   tax (included) = Σ discounted line value × rate / (100 + rate)
 *   shipping       = store flat fee, waived at/above the free-shipping threshold (0 = no threshold)
 *   grand total    = subtotal − discount + shipping
 * Every amount the customer pays is computed here on the server; the frontend only displays it.
 */
import { BusinessRuleError } from "../../../utils/errors.js";
import { evaluateCoupon, type CouponContext, type CouponResult, type PricedLine } from "../coupons/coupon-rules.js";
import { round2 } from "../shared/http.js";
import { getSettings } from "../shared/settings.js";

export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  coupon: { code: string; description: string | null; discount: number } | null;
  couponError: string | null;
  freeShippingThreshold: number;
}

export async function priceLines(
  lines: PricedLine[],
  couponCode: string | null | undefined,
  ctx: CouponContext & { strictCoupon?: boolean } = {},
): Promise<PriceBreakdown & { couponResult?: CouponResult }> {
  const settings = await getSettings();
  const subtotal = round2(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));

  let couponResult: CouponResult | undefined;
  let couponError: string | null = null;
  if (couponCode && lines.length > 0) {
    try {
      couponResult = await evaluateCoupon(couponCode, lines, ctx);
    } catch (error) {
      if (ctx.strictCoupon || !(error instanceof BusinessRuleError)) throw error;
      couponError = error.message;
    }
  }
  const discount = couponResult?.discount ?? 0;

  const eligibleValue = couponResult
    ? lines.filter((line) => couponResult!.eligibleProductIds.has(line.productId)).reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
    : 0;
  const tax = round2(
    lines.reduce((sum, line) => {
      const value = line.unitPrice * line.quantity;
      const share = couponResult?.eligibleProductIds.has(line.productId) && eligibleValue > 0 ? (discount * value) / eligibleValue : 0;
      return sum + ((value - share) * line.taxRate) / (100 + line.taxRate);
    }, 0),
  );

  const { flatFee, freeShippingThreshold } = settings.shipping;
  const afterDiscount = subtotal - discount;
  const shipping = lines.length === 0 || (freeShippingThreshold > 0 && afterDiscount >= freeShippingThreshold) ? 0 : round2(flatFee);

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total: round2(afterDiscount + shipping),
    coupon: couponResult ? { code: couponResult.coupon.code, description: couponResult.coupon.description, discount } : null,
    couponError,
    freeShippingThreshold,
    couponResult,
  };
}

/** Delivery availability for a pincode. An empty prefix list in settings means every pincode is serviceable. */
export async function isPincodeServiceable(pincode: string): Promise<boolean> {
  const { serviceablePincodePrefixes } = (await getSettings()).shipping;
  return serviceablePincodePrefixes.length === 0 || serviceablePincodePrefixes.some((prefix) => pincode.startsWith(prefix));
}
