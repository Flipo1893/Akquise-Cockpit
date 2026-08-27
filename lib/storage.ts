import type { Entity } from "./types";

export const KEY_KUNDEN = "crm_kunden";
export const KEY_KOOP = "crm_koop";
export const KEY_SEEDED = "crm_seeded";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function saveKunden(list: Entity[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_KUNDEN, JSON.stringify(list));
}

export function saveKoop(list: Entity[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_KOOP, JSON.stringify(list));
}

export function resetAllData(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(KEY_KUNDEN);
  localStorage.removeItem(KEY_KOOP);
  localStorage.removeItem(KEY_SEEDED);
}
