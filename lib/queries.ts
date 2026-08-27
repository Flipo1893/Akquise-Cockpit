import "server-only";

import { rowToEntity } from "./mappers";
import { createClient } from "./supabase/server";
import type { ContactRow } from "./supabase/database.types";
import type { Entity, EntityTyp } from "./types";

/**
 * Lädt die Kontakte für den ersten Render. RLS sorgt dafür, dass hier
 * ausschliesslich die Zeilen der angemeldeten Person zurückkommen — ein
 * `owner_id`-Filter im Query wäre reine Dopplung.
 */
export async function getContacts(typ: EntityTyp): Promise<Entity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("typ", typ)
    .order("geaendert_am", { ascending: false });

  if (error) {
    console.error(`Kontakte (${typ}) konnten nicht geladen werden.`, error);
    return [];
  }
  return (data as ContactRow[]).map(rowToEntity);
}

export async function getAllContacts(): Promise<{
  kunden: Entity[];
  koop: Entity[];
}> {
  const [kunden, koop] = await Promise.all([
    getContacts("kunde"),
    getContacts("kooperation"),
  ]);
  return { kunden, koop };
}
