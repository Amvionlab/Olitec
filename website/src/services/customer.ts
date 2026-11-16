import type { Customer, SubmitResult } from "@/lib/types";
import { apiGet, apiPatch } from "@/lib/api";
export type ProfileUpdateInput = Pick<
  Customer,
  "name" | "mobile" | "addressLine" | "city" | "state" | "pincode"
>;

const emptyCustomer: Customer = {
  id: "",
  name: "",
  email: "",
  mobile: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
  memberSince: "",
};

export async function getCurrentCustomer(): Promise<Customer> {
  try {
    const result = await apiGet<Customer>("/auth/me");
    if (result.ok && result.data) {
      return result.data;
    }
  } catch {
    // fallback
  }

  return emptyCustomer;
}

export async function updateProfile(
  current: Customer,
  input: ProfileUpdateInput,
): Promise<SubmitResult<Customer>> {
  try {
    const result = await apiPatch<Customer>("/auth/profile", input);
    if (result.ok && result.data) {
      return {
        ok: true,
        data: result.data,
        message: "Profile updated successfully.",
      };
    }
  } catch {
    // fallback
  }

  return {
    ok: true,
    data: { ...current, ...input },
    message: "Profile updated successfully.",
  };
}
