
import type { Customer, SubmitResult } from "@/lib/types";
import { apiGet, apiPatch } from "@/lib/api";

export type ProfileUpdateInput = Pick<
  Customer,
  "name" | "mobile" | "addressLine" | "city" | "state" | "pincode"
>;

export async function getCurrentCustomer(): Promise<Customer> {
  const result = await apiGet<Customer>("/ecommerce/account/me");

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

export async function updateProfile(
  current: Customer,
  input: ProfileUpdateInput
): Promise<SubmitResult<Customer>> {
  const result = await apiPatch<Customer>(
    "/ecommerce/account/me",
    input
  );

  if (!result.ok) {
    return {
      ok: false,
      message: result.message,
    };
  }

  return {
    ok: true,
    data: result.data,
    message: "Profile updated successfully.",
  };
}
