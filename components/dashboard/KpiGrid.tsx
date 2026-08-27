import type { Entity } from "@/lib/types";

export interface Kpi {
  total: number;
  kontaktiertDiese: number;
  antwortquote: number;
  conversion: number;
  offeneWV: number;
}

export function computeKpi(list: Entity[], periodDays: number): Kpi {
  const cutoff = periodDays > 0 ? Date.now() - periodDays * 86400000 : -Infinity;
  const total = list.length;
  const kontaktiertDiese = list.filter(
    (c) => new Date(c.geändertAm).getTime() >= cutoff && c.status !== "Neu",
  ).length;
  const geantwortet = list.filter((c) => c.history.some((h) => h.richtung === "rein"));
  const kontaktiertGesamt = list.filter(
    (c) => c.status !== "Neu" && c.status !== "Recherchiert",
  );
  const antwortquote = kontaktiertGesamt.length
    ? Math.round((geantwortet.length / kontaktiertGesamt.length) * 100)
    : 0;
  const gewonnenKeys = ["Gewonnen", "Aktive Kooperation"];
  const gewonnen = list.filter((c) => gewonnenKeys.includes(c.status)).length;
  const conversion = kontaktiertGesamt.length
    ? Math.round((gewonnen / kontaktiertGesamt.length) * 100)
    : 0;
  const offeneWV = list.filter((c) => c.nextAction?.datum).length;
  return { total, kontaktiertDiese, antwortquote, conversion, offeneWV };
}

export default function KpiGrid({ kpi }: { kpi: Kpi }) {
  const items: [string, number | string][] = [
    ["Kontakte gesamt", kpi.total],
    ["Kontaktiert (Zeitraum)", kpi.kontaktiertDiese],
    ["Antwortquote", `${kpi.antwortquote}%`],
    ["Conversion → Gewonnen", `${kpi.conversion}%`],
    ["Offene Wiedervorlagen", kpi.offeneWV],
  ];

  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-3 sm:divide-y-0">
      {items.map(([label, val]) => (
        <div key={label} className="px-4 py-3">
          <div className="mb-1 text-xs text-mute">{label}</div>
          <div className="font-mono text-2xl font-semibold tracking-tight">{val}</div>
        </div>
      ))}
    </div>
  );
}
