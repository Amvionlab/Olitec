
import { cookies } from "next/headers";
import type { Customer } from "@/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000/api";

interface CustomerResponse {
  id: number;
  name: string;
  email: string;
  mobile: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  memberSince: string;
}


export async function getCurrentCustomer(): Promise<Customer> {
  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  console.log("Customer cookies available:", cookieHeader.length > 0);

  const response = await fetch(
    `${API_URL}/ecommerce/auth/me`,
    {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    }
  );

  const responseText = await response.text();

  console.log("Customer API status:", response.status);
  console.log("Customer API response:", responseText);

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error("Customer API returned invalid JSON.");
  }

  if (!response.ok || !result.success || !result.data) {
    throw new Error(
      result.error?.message ||
      result.message ||
      `Customer API failed: ${response.status}`
    );
  }

  const customer = result.data;

  return {
    id: String(customer.id),
    name: customer.name,
    email: customer.email,
    mobile: customer.mobile,
    addressLine: customer.addressLine || "",
    city: customer.city || "",
    state: customer.state || "",
    pincode: customer.pincode || "",
    memberSince: customer.memberSince,
  };
}
