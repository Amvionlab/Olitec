/**
 * Role-based UI permissions. In Phase 1 these only control which buttons are shown;
 * Phase 2 must enforce the same rules on the backend for every admin route.
 */
import type { AdminRole, WarrantyStatus } from "./types";

const permissions = {
  "Super Admin": { reviewWarranties: true, updateWarrantyStatus: true },
  "Warranty Reviewer": { reviewWarranties: true, updateWarrantyStatus: false },
} satisfies Record<AdminRole, Record<string, boolean>>;

export type Permission = keyof (typeof permissions)["Super Admin"];

export function can(role: AdminRole, permission: Permission): boolean {
  return permissions[role][permission];
}

/** Manual status changes an authorised admin may make after review. */
export const allowedStatusTransitions: Record<WarrantyStatus, WarrantyStatus[]> = {
  Pending: [],
  Active: ["Expired"],
  Expired: ["Active"],
  Rejected: ["Pending"],
};
