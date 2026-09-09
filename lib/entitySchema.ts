import { STATUS_KOOP, STATUS_KUNDEN } from "./status";
import type { Entity, EntityTyp, NextAction, Priority } from "./types";

export const PRIORITIES: Priority[] = ["hoch", "mittel", "tief"];

/** Felder, die aus einer CSV-Zeile oder einem Formular gesetzt werden dürfen. */
export const TEXT_FIELDS = [
  "firma", "kontakt", "rolle", "email", "telefon", "website", "adresse", "plz",
  "ort", "kanton", "branche", "quelle", "notizen",
] as const;

/** Zusätzliche Felder, die nur Kooperationen haben. */
export const KOOP_FIELDS = ["art", "wirBekommen", "partnerBekommt"] as const;

export function statusKeys(typ: EntityTyp): string[] {
  return (typ === "kooperation" ? STATUS_KOOP : STATUS_KUNDEN).map((s) => s.key);
}

export function isEntityTyp(value: unknown): value is EntityTyp {
  return value === "kunde" || value === "kooperation";
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(value: unknown, typ: EntityTyp): string {
  const keys = statusKeys(typ);
  const raw = str(value);
  return keys.includes(raw) ? raw : "Neu";
}

function normalizePriority(value: unknown): Priority {
  const raw = str(value).toLowerCase();
  return (PRIORITIES as string[]).includes(raw) ? (raw as Priority) : "mittel";
}

function normalizeTags(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : str(value).split(";");
  return raw.map((t) => String(t).trim()).filter(Boolean);
}

function normalizeDate(value: unknown): string | null {
  const raw = str(value);
  if (!raw) return null;
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

function normalizeNextAction(value: unknown): NextAction | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const datum = normalizeDate(input.datum);
  if (!datum) return null;
  return { beschreibung: str(input.beschreibung) || "Follow-up", datum };
}

export class ValidationError extends Error {}

/**
 * Baut aus beliebigem JSON einen vollständigen, gültigen Kontakt. Unbekannte
 * Felder fallen weg, ungültige Werte werden auf Defaults gesetzt — nur eine
 * fehlende Firma ist ein harter Fehler, weil ohne sie kein Eintrag Sinn ergibt.
 */
export function buildEntity(input: unknown, typ: EntityTyp): Entity {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Ungültiger Datensatz.");
  }
  const raw = input as Record<string, unknown>;
  const firma = str(raw.firma);
  if (!firma) throw new ValidationError("Feld 'firma' ist erforderlich.");

  const now = new Date().toISOString();
  const status = normalizeStatus(raw.status, typ);
  const entity: Entity = {
    id: crypto.randomUUID(),
    typ,
    firma,
    kontakt: "", rolle: "", email: "", telefon: "", website: "", adresse: "",
    plz: "", ort: "", kanton: "", branche: "", quelle: "", notizen: "",
    status,
    priorität: normalizePriority(raw["priorität"] ?? raw.prioritat ?? raw.prio),
    tags: normalizeTags(raw.tags),
    erstelltAm: now,
    geändertAm: now,
    history: [],
    nextAction: normalizeNextAction(raw.nextAction),
    statusHistory: [{ status, datum: now }],
  };
  for (const field of TEXT_FIELDS) entity[field] = str(raw[field]);
  entity.firma = firma;

  if (typ === "kooperation") {
    for (const field of KOOP_FIELDS) entity[field] = str(raw[field]);
  }
  return entity;
}

/** Felder, die ein PATCH verändern darf. */
export type EntityPatch = Partial<
  Pick<Entity, (typeof TEXT_FIELDS)[number] | (typeof KOOP_FIELDS)[number]> &
    Pick<Entity, "status" | "priorität" | "tags" | "nextAction">
>;

/**
 * Übernimmt aus einem PATCH-Body nur die Felder, die tatsächlich gesendet
 * wurden. So überschreibt ein Teil-Update nicht versehentlich andere Felder.
 */
export function buildPatch(input: unknown, typ: EntityTyp): EntityPatch {
  if (!input || typeof input !== "object") {
    throw new ValidationError("Ungültiger Datensatz.");
  }
  const raw = input as Record<string, unknown>;
  const patch: EntityPatch = {};

  const fields = typ === "kooperation" ? [...TEXT_FIELDS, ...KOOP_FIELDS] : TEXT_FIELDS;
  for (const field of fields) {
    if (field in raw) patch[field] = str(raw[field]);
  }
  if ("firma" in raw && !patch.firma) {
    throw new ValidationError("Feld 'firma' darf nicht leer sein.");
  }
  if ("status" in raw) {
    const status = str(raw.status);
    if (!statusKeys(typ).includes(status)) {
      throw new ValidationError(`Unbekannter Status: ${status || "(leer)"}`);
    }
    patch.status = status;
  }
  if ("priorität" in raw) patch["priorität"] = normalizePriority(raw["priorität"]);
  if ("tags" in raw) patch.tags = normalizeTags(raw.tags);
  if ("nextAction" in raw) patch.nextAction = normalizeNextAction(raw.nextAction);

  if (Object.keys(patch).length === 0) {
    throw new ValidationError("Keine änderbaren Felder im Request.");
  }
  return patch;
}
