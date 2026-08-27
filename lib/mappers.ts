import type { ContactInsert, ContactRow } from "./supabase/database.types";
import type { Entity } from "./types";

/** DB-Zeile → das Entity-Modell, mit dem die UI arbeitet. */
export function rowToEntity(row: ContactRow): Entity {
  return {
    id: row.id,
    typ: row.typ,
    firma: row.firma,
    kontakt: row.kontakt,
    rolle: row.rolle,
    email: row.email,
    telefon: row.telefon,
    website: row.website,
    adresse: row.adresse,
    plz: row.plz,
    ort: row.ort,
    kanton: row.kanton,
    branche: row.branche,
    quelle: row.quelle,
    status: row.status,
    priorität: row.prioritaet,
    tags: row.tags ?? [],
    notizen: row.notizen,
    erstelltAm: row.erstellt_am,
    geändertAm: row.geaendert_am,
    history: row.history ?? [],
    statusHistory: row.status_history ?? [],
    nextAction: row.next_action_datum
      ? {
          beschreibung: row.next_action_beschreibung ?? "Follow-up",
          datum: row.next_action_datum,
        }
      : null,
    ...(row.typ === "kooperation"
      ? {
          art: row.art,
          wirBekommen: row.wir_bekommen,
          partnerBekommt: row.partner_bekommt,
        }
      : {}),
  };
}

/** Entity → DB-Zeile zum Einfügen. `id` und Zeitstempel vergibt Postgres. */
export function entityToInsert(entity: Entity, ownerId: string): ContactInsert {
  return {
    owner_id: ownerId,
    typ: entity.typ,
    firma: entity.firma,
    kontakt: entity.kontakt,
    rolle: entity.rolle,
    email: entity.email,
    telefon: entity.telefon,
    website: entity.website,
    adresse: entity.adresse,
    plz: entity.plz,
    ort: entity.ort,
    kanton: entity.kanton,
    branche: entity.branche,
    quelle: entity.quelle,
    status: entity.status,
    prioritaet: entity.priorität,
    tags: entity.tags,
    notizen: entity.notizen,
    history: entity.history,
    status_history: entity.statusHistory,
    next_action_beschreibung: entity.nextAction?.beschreibung ?? null,
    next_action_datum: entity.nextAction?.datum ?? null,
    art: entity.art ?? "",
    wir_bekommen: entity.wirBekommen ?? "",
    partner_bekommt: entity.partnerBekommt ?? "",
  };
}
