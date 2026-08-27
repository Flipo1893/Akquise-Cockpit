export type Priority = "hoch" | "mittel" | "tief";
export type EntityTyp = "kunde" | "kooperation";

export interface HistoryEntry {
  datum: string;
  kanal: string;
  richtung: "raus" | "rein";
  betreff?: string;
  inhalt?: string;
  ergebnis?: string;
  nachrichtenId?: string | null;
  versandstatus?: string;
  antwortstatus?: string;
}

export interface StatusHistoryEntry {
  status: string;
  datum: string;
}

export interface NextAction {
  beschreibung: string;
  datum: string;
}

export interface Entity {
  id: string;
  typ: EntityTyp;
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
  priorität: Priority;
  tags: string[];
  notizen: string;
  erstelltAm: string;
  geändertAm: string;
  history: HistoryEntry[];
  nextAction: NextAction | null;
  statusHistory: StatusHistoryEntry[];
  // Kooperation-only fields
  art?: string;
  wirBekommen?: string;
  partnerBekommt?: string;
}
