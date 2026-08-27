import type { HistoryEntry, StatusHistoryEntry } from "@/lib/types";

/**
 * Passend zu supabase/migrations/0001_init.sql.
 * Kann später durch `supabase gen types typescript` ersetzt werden.
 *
 * Bewusst ein `type` und kein `interface`: postgrest-js verlangt für Zeilen
 * `Record<string, unknown>`, und Interfaces erfüllen das mangels impliziter
 * Index-Signatur nicht — die Tabelle würde sonst als `never` aufgelöst.
 */
export type ContactRow = {
  id: string;
  owner_id: string;
  typ: "kunde" | "kooperation";
  firma: string;
  kontakt: string;
  rolle: string;
  email: string;
  telefon: string;
  website: string;
  adresse: string;
  plz: string;
  ort: string;
  kanton: string;
  branche: string;
  quelle: string;
  status: string;
  prioritaet: "hoch" | "mittel" | "tief";
  tags: string[];
  notizen: string;
  history: HistoryEntry[];
  status_history: StatusHistoryEntry[];
  next_action_beschreibung: string | null;
  next_action_datum: string | null;
  art: string;
  wir_bekommen: string;
  partner_bekommt: string;
  erstellt_am: string;
  geaendert_am: string;
};

/**
 * Löst eine Intersection in einen flachen Objekttyp auf. postgrest-js prüft
 * Insert-Werte auf überzählige Properties und kommt mit `A & B` nicht klar.
 */
type Flatten<T> = { [K in keyof T]: T[K] };

export type ContactInsert = Flatten<
  Omit<ContactRow, "id" | "erstellt_am" | "geaendert_am"> &
    Partial<Pick<ContactRow, "id" | "erstellt_am" | "geaendert_am">>
>;

export type ContactUpdate = Partial<Omit<ContactRow, "id" | "owner_id">>;

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: ContactRow;
        Insert: ContactInsert;
        Update: ContactUpdate;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
