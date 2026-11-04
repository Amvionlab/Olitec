/** Typed access to ecom_settings (editable in Admin → E-Commerce → Settings). Cached briefly per process. */
import { execute, query } from "../../../db/pool.js";
import { json } from "./http.js";

export interface StoreSettings {
  store: { name: string; supportEmail: string; supportPhone: string; gstin: string; legalName: string; address: string };
  shipping: { flatFee: number; freeShippingThreshold: number; serviceablePincodePrefixes: string[]; estimatedDays: string };
  checkout: { guestCheckout: boolean; codEnabled: boolean; codMaxOrderValue: number; reservationMinutes: number };
  returns: { returnWindowDays: number; cancellableStatuses: string[] };
  social: { facebook: string; instagram: string; linkedin: string; youtube: string };
}

export const DEFAULT_SETTINGS: StoreSettings = {
  store: { name: "OLITEC Shop", supportEmail: "", supportPhone: "", gstin: "", legalName: "", address: "" },
  shipping: { flatFee: 0, freeShippingThreshold: 0, serviceablePincodePrefixes: [], estimatedDays: "" },
  checkout: { guestCheckout: true, codEnabled: false, codMaxOrderValue: 0, reservationMinutes: 30 },
  returns: { returnWindowDays: 0, cancellableStatuses: ["pending_payment", "confirmed", "processing"] },
  social: { facebook: "", instagram: "", linkedin: "", youtube: "" },
};

let cache: { value: StoreSettings; at: number } | undefined;
const TTL_MS = 30_000;

export async function getSettings(): Promise<StoreSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const rows = await query<{ setting_key: keyof StoreSettings; setting_value: unknown }>("SELECT setting_key, setting_value FROM ecom_settings");
  const value = structuredClone(DEFAULT_SETTINGS) as StoreSettings;
  for (const row of rows) {
    if (row.setting_key in value) {
      Object.assign(value[row.setting_key], json<Record<string, unknown>>(row.setting_value, {}));
    }
  }
  cache = { value, at: Date.now() };
  return value;
}

export async function updateSettings(key: keyof StoreSettings, patch: Record<string, unknown>): Promise<StoreSettings> {
  const current = await getSettings();
  const next = { ...current[key], ...patch };
  await execute(
    "INSERT INTO ecom_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
    [key, JSON.stringify(next)],
  );
  cache = undefined;
  return getSettings();
}

export function clearSettingsCache(): void {
  cache = undefined;
}
