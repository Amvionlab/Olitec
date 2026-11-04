// Phase 1: returns the demo customer. Phase 2: replace with GET/PATCH /api/customers/me.
import type { Customer, SubmitResult } from "@/lib/types";
import { mockCurrentCustomer } from "@/mock/data";
import { mockDelay } from "./mock-delay";

export async function getCurrentCustomer(): Promise<Customer> {
  return mockCurrentCustomer;
}

export type ProfileUpdateInput = Pick<Customer, "name" | "mobile" | "addressLine" | "city" | "state" | "pincode">;

/** MOCK update: returns the merged profile but does not persist it. */
export async function updateProfile(current: Customer, input: ProfileUpdateInput): Promise<SubmitResult<Customer>> {
  await mockDelay();
  return { ok: true, data: { ...current, ...input }, message: "Profile updated." };
}
