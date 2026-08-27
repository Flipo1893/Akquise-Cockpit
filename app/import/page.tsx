"use client";

import { useMemo, useState } from "react";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import { storeFor } from "@/lib/entityStore";
import { resetAllData } from "@/lib/storage";
import type { Entity, Priority } from "@/lib/types";
import { buttonPrimaryClass, buttonSecondaryClass, cardClass, inputClass, selectClass } from "@/lib/ui";

type Target = "kunden" | "koop";

const COLS_KUNDEN = [
  "firma", "kontakt", "rolle", "email", "telefon", "website", "adresse", "plz", "ort",
  "kanton", "branche", "quelle", "status", "priorität", "tags", "notizen",
];
const COLS_KOOP = [...COLS_KUNDEN, "art", "wirBekommen", "partnerBekommt"];

const STATUS_KUNDEN_KEYS = [
  "Neu", "Recherchiert", "Kontaktiert", "Antwort erhalten", "Termin vereinbart",
  "Angebot draussen", "Gewonnen", "Verloren", "Kein Interesse", "Später nochmal",
];
const STATUS_KOOP_KEYS = [
  "Neu", "Kontaktiert", "Im Gespräch", "Vereinbarung in Arbeit",
  "Aktive Kooperation", "Abgelehnt", "Auf Eis",
];

function buildTemplate(target: Target): string {
  const cols = target === "koop" ? COLS_KOOP : COLS_KUNDEN;
  const sample =
    target === "koop"
      ? ["Studio Beispiel", "Anna Muster", "Inhaberin", "anna@beispiel.ch", "", "beispiel.ch", "", "8000", "Zürich", "ZH", "Design", "LinkedIn", "Neu", "mittel", "Cross-Sell", "Erstkontakt geplant", "Reseller", "Zugang zu Kunden", "Zugang zu unserem Netzwerk"]
      : ["Muster AG", "Sabine Muster", "Einkauf", "sabine@muster.ch", "044 000 00 00", "muster.ch", "", "8000", "Zürich", "ZH", "Handel", "Messe", "Neu", "mittel", "Zielkunde", "Aus Messe-Kontakt"];
  return cols.join(",") + "\n" + sample.join(",");
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export default function ImportPage() {
  const [target, setTarget] = useState<Target>("kunden");
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  const cols = target === "koop" ? COLS_KOOP : COLS_KUNDEN;
  const downloadHref = useMemo(() => {
    return "data:text/csv;charset=utf-8," + encodeURIComponent(buildTemplate(target));
  }, [target]);

  function handleImport() {
    const raw = csv.trim();
    if (!raw) {
      setResult({ added: 0, skipped: 0 });
      return;
    }

    const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l.length);
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const rows = lines.slice(1);
    const statusKeys = target === "koop" ? STATUS_KOOP_KEYS : STATUS_KUNDEN_KEYS;
    const typ = target === "koop" ? "kooperation" : "kunde";
    const store = storeFor(typ);
    const list = [...store.getSnapshot()];

    let added = 0;
    let skipped = 0;

    rows.forEach((line) => {
      if (!line) return;
      const values = parseCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = values[i] || ""));
      if (!row.firma) {
        skipped++;
        return;
      }

      const now = new Date().toISOString();
      let status = row.status || "Neu";
      if (!statusKeys.includes(status)) status = "Neu";
      let prio = (row["priorität"] || row["prioritat"] || "mittel").toLowerCase();
      if (!["hoch", "mittel", "tief"].includes(prio)) prio = "mittel";

      const entry: Entity = {
        id: crypto.randomUUID(),
        typ,
        firma: row.firma,
        kontakt: row.kontakt || "",
        rolle: row.rolle || "",
        email: row.email || "",
        telefon: row.telefon || "",
        website: row.website || "",
        adresse: row.adresse || "",
        plz: row.plz || "",
        ort: row.ort || "",
        kanton: row.kanton || "",
        branche: row.branche || "",
        quelle: row.quelle || "",
        status,
        priorität: prio as Priority,
        tags: row.tags ? row.tags.split(";").map((t) => t.trim()).filter(Boolean) : [],
        notizen: row.notizen || "",
        erstelltAm: now,
        geändertAm: now,
        history: [],
        nextAction: null,
        statusHistory: [{ status, datum: now }],
      };
      if (typ === "kooperation") {
        entry.art = row.art || "";
        entry.wirBekommen = row.wirbekommen || "";
        entry.partnerBekommt = row.partnerbekommt || "";
      }
      list.push(entry);
      added++;
    });

    store.set(list);
    setResult({ added, skipped });
    setCsv("");
  }

  function handleReset() {
    if (!confirm("Alle lokalen Daten wirklich löschen und Beispieldaten neu laden?")) return;
    resetAllData();
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Import</h1>
          <p className="mt-0.5 text-sm text-mute">
            CSV-Daten als Kunden oder Kooperationen einlesen.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <section className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-b border-line bg-paper-2 px-4 py-2.5">
              <h2 className="text-sm font-semibold">CSV einfügen</h2>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as Target)}
                className={`w-auto ${selectClass}`}
              >
                <option value="kunden">Ziel: Kunden</option>
                <option value="koop">Ziel: Kooperationen</option>
              </select>
            </div>
            <div className="p-4">
              <textarea
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                rows={12}
                placeholder={
                  "firma,kontakt,rolle,email,telefon,website,branche,ort,status,priorität,notizen\nMuster AG,Sabine Muster,Einkauf,sabine@muster.ch,044 000 00 00,muster.ch,Handel,Zürich,Neu,mittel,Aus Messe-Kontakt"
                }
                className={`${inputClass} font-mono text-xs leading-relaxed`}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button onClick={handleImport} className={buttonPrimaryClass}>
                  Importieren
                </button>
                <button
                  onClick={() => setCsv(buildTemplate(target))}
                  className={buttonSecondaryClass}
                >
                  Vorlage laden
                </button>
                <a
                  href={downloadHref}
                  download={`vorlage-${target}.csv`}
                  className={buttonSecondaryClass}
                >
                  Vorlage herunterladen
                </a>
              </div>
              {result && (
                <div className="mt-4 rounded-md border border-line bg-paper-2 px-3 py-2 text-sm">
                  <span className="font-medium">{result.added}</span> Einträge importiert
                  {result.skipped ? (
                    <>
                      , <span className="text-accent">{result.skipped}</span> übersprungen
                      (Firma fehlt)
                    </>
                  ) : (
                    ""
                  )}
                  . Ziel: {target === "koop" ? "Kooperationen" : "Kunden"}.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <section className={`${cardClass} p-4`}>
              <h3 className="mb-2 text-sm font-semibold">Erwartete Spalten</h3>
              <p className="mb-2 text-xs text-mute">
                Erste Zeile = Kopfzeile. Reihenfolge egal, unbekannte Spalten werden ignoriert.
              </p>
              <div className="space-y-0.5 font-mono text-xs leading-relaxed text-mute">
                {cols.map((c) => (
                  <div key={c}>{c}</div>
                ))}
              </div>
            </section>
            <section className={`${cardClass} p-4`}>
              <h3 className="mb-2 text-sm font-semibold">Hinweise</h3>
              <ul className="list-disc space-y-1.5 pl-4 text-xs text-mute">
                <li>Tags mit Semikolon trennen, z.B. &quot;Warm;Zielkunde&quot;.</li>
                <li>Fehlender Status wird zu &quot;Neu&quot;.</li>
                <li>Fehlende Priorität wird zu &quot;mittel&quot;.</li>
                <li>Zeilen werden ergänzt, bestehende Daten bleiben erhalten.</li>
              </ul>
            </section>
            <section className={`${cardClass} p-4`}>
              <h3 className="mb-2 text-sm font-semibold text-accent">Daten zurücksetzen</h3>
              <p className="mb-3 text-xs text-mute">
                Löscht alle lokalen Kunden- und Kooperationsdaten und lädt die Beispieldaten neu.
              </p>
              <button
                onClick={handleReset}
                className={`w-full ${buttonSecondaryClass} text-accent`}
              >
                Zurücksetzen
              </button>
            </section>
          </aside>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
