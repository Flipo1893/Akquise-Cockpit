"use server";

import { redirect } from "next/navigation";
import { entityToInsert, rowToEntity } from "@/lib/mappers";
import { createClient } from "@/lib/supabase/server";
import type { ContactRow } from "@/lib/supabase/database.types";
import type { Entity, EntityTyp, Priority } from "@/lib/types";

/**
 * Server Actions laufen als POST auf ihrer jeweiligen Route und können damit
 * einen Proxy-Matcher umgehen. Deshalb prüft jede Action die Session selbst,
 * zusätzlich zu den RLS-Policies in Postgres.
 */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  entity?: Entity;
  id?: string;
}

function fail(message: string, error: unknown): ActionResult {
  console.error(message, error);
  return { ok: false, error: message };
}

export async function createContact(
  typ: EntityTyp,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const firma = String(formData.get("firma") || "").trim();
  if (!firma) return { ok: false, error: "Firma ist ein Pflichtfeld." };

  const text = (key: string) => String(formData.get(key) || "").trim();
  const status = text("status") || "Neu";

  const draft: Entity = {
    id: "",
    typ,
    firma,
    kontakt: text("kontakt"),
    rolle: text("rolle"),
    email: text("email"),
    telefon: text("telefon"),
    website: text("website"),
    adresse: "",
    plz: text("plz"),
    ort: text("ort"),
    kanton: text("kanton"),
    branche: text("branche"),
    quelle: text("quelle"),
    status,
    priorität: (text("priorität") as Priority) || "mittel",
    tags: [],
    notizen: text("notizen"),
    erstelltAm: new Date().toISOString(),
    geändertAm: new Date().toISOString(),
    history: [],
    nextAction: null,
    statusHistory: [{ status, datum: new Date().toISOString() }],
    ...(typ === "kooperation"
      ? {
          art: text("art"),
          wirBekommen: text("wirBekommen"),
          partnerBekommt: text("partnerBekommt"),
        }
      : {}),
  };

  const { data, error } = await supabase
    .from("contacts")
    .insert(entityToInsert(draft, user.id))
    .select()
    .single();

  if (error) return fail("Speichern fehlgeschlagen.", error);
  return { ok: true, entity: rowToEntity(data as ContactRow) };
}

export async function updateStatus(id: string, status: string): Promise<ActionResult> {
  const { supabase } = await requireUser();

  const { data: current, error: readError } = await supabase
    .from("contacts")
    .select("status_history")
    .eq("id", id)
    .single();

  if (readError) return fail("Eintrag nicht gefunden.", readError);

  const history = [
    ...((current?.status_history as ContactRow["status_history"]) ?? []),
    { status, datum: new Date().toISOString() },
  ];

  const { data, error } = await supabase
    .from("contacts")
    .update({ status, status_history: history })
    .eq("id", id)
    .select()
    .single();

  if (error) return fail("Status konnte nicht geändert werden.", error);
  return { ok: true, entity: rowToEntity(data as ContactRow) };
}

export async function setNextAction(
  id: string,
  datum: string,
): Promise<ActionResult> {
  const { supabase } = await requireUser();

  const parsed = datum ? new Date(datum) : null;
  if (datum && Number.isNaN(parsed?.getTime())) {
    return { ok: false, error: "Ungültiges Datum." };
  }

  const { data, error } = await supabase
    .from("contacts")
    .update({
      next_action_beschreibung: parsed ? "Follow-up" : null,
      next_action_datum: parsed ? parsed.toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return fail("Wiedervorlage konnte nicht gesetzt werden.", error);
  return { ok: true, entity: rowToEntity(data as ContactRow) };
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();

  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return fail("Löschen fehlgeschlagen.", error);
  return { ok: true, id };
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  added: number;
  entities: Entity[];
}

/** Für den CSV-Import und die Übernahme alter localStorage-Daten. */
export async function importContacts(
  typ: EntityTyp,
  entities: Entity[],
): Promise<ImportResult> {
  const { supabase, user } = await requireUser();

  if (!entities.length) return { ok: true, added: 0, entities: [] };
  if (entities.length > 2000) {
    return { ok: false, error: "Maximal 2000 Zeilen pro Import.", added: 0, entities: [] };
  }

  const rows = entities
    .filter((e) => e.firma?.trim())
    .map((e) => entityToInsert({ ...e, typ }, user.id));

  const { data, error } = await supabase.from("contacts").insert(rows).select();
  if (error) {
    console.error("Import fehlgeschlagen.", error);
    return { ok: false, error: "Import fehlgeschlagen.", added: 0, entities: [] };
  }

  const imported = (data as ContactRow[]).map(rowToEntity);
  return { ok: true, added: imported.length, entities: imported };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
