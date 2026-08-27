export interface StatusDef {
  key: string;
  color: string;
}

export const STATUS_KUNDEN: StatusDef[] = [
  { key: "Neu", color: "#9a988f" },
  { key: "Recherchiert", color: "#8a8878" },
  { key: "Kontaktiert", color: "#c1552f" },
  { key: "Antwort erhalten", color: "#c9702a" },
  { key: "Termin vereinbart", color: "#3d6b5c" },
  { key: "Angebot draussen", color: "#3d6b8f" },
  { key: "Gewonnen", color: "#2f7d4f" },
  { key: "Verloren", color: "#8a2f2f" },
  { key: "Kein Interesse", color: "#8a8878" },
  { key: "Später nochmal", color: "#b08a2f" },
];

export const STATUS_KOOP: StatusDef[] = [
  { key: "Neu", color: "#9a988f" },
  { key: "Kontaktiert", color: "#c1552f" },
  { key: "Im Gespräch", color: "#c9702a" },
  { key: "Vereinbarung in Arbeit", color: "#3d6b8f" },
  { key: "Aktive Kooperation", color: "#2f7d4f" },
  { key: "Abgelehnt", color: "#8a2f2f" },
  { key: "Auf Eis", color: "#b08a2f" },
];

export function statusColor(list: StatusDef[], key: string): string {
  return list.find((s) => s.key === key)?.color ?? "#9a988f";
}

export function priorityLabel(p: string): string {
  return p === "hoch" ? "Hoch" : p === "mittel" ? "Mittel" : "Tief";
}

export function priorityClass(p: string): string {
  return p === "hoch" ? "text-accent" : p === "mittel" ? "text-amber" : "text-mute";
}
