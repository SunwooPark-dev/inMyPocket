import { RETAILERS, STORES } from "./catalog.ts";
import type { RetailerId, StoreLocation } from "./domain.ts";

export function getStoreById(storeId: string): StoreLocation | null {
  return STORES.find((store) => store.id === storeId) ?? null;
}

export function getRetailerDomains(retailerId: RetailerId) {
  return RETAILERS.find((retailer) => retailer.id === retailerId)?.officialDomains ?? [];
}

export function isAllowedSourceUrl(retailerId: RetailerId, sourceUrl: string) {
  try {
    const parsed = new URL(sourceUrl);

    if (parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    return getRetailerDomains(retailerId).some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}
