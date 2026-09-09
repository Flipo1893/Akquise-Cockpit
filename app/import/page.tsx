"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import StateBanner from "@/components/ui/StateBanner";
import { importRows, resetAllData } from "@/lib/entityStore";
import type { EntityTyp } from "@/lib/types";
import { buttonPrimaryClass, buttonSecondaryClass, cardClass, inputClass, selectClass } from "@/lib/ui";

type Target = "kunden" | "koop";

const COLS_KUNDEN = [
  "firma", "kontakt", "rolle", "email", "telefon", "website", "adresse", "plz", "ort",
  "kanton", "branche", "quelle", "status", "priorität", "tags", "notizen",
];
const COLS_KOOP = [...COLS_KUNDEN, "art", "wirBekommen", "partnerBekommt"];

/** CSV-Kopfzeilen werden kleingeschrieben verglichen — diese heissen intern anders. */
const FIELD_ALIASES: Record<string, string> = {
  wirbekommen: "wirBekommen",
  partnerbekommt: "partnerBekommt",
  prioritat: "priorität",
  prioritaet: "priorität",
};

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
  const router = useRouter();
  const [target, setTarget] = useState<Target>("kunden");
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  const cols = target === "koop" ? COLS_KOOP : COLS_KUNDEN;
  const downloadHref = useMemo(() => {
    return "data:text/csv;charset=utf-8," + encodeURIComponent(buildTemplate(target));
  }, [target]);

  /**
   * Die CSV wird im Browser geparst, geschrieben wird serverseitig. Status,
   * Priorität und Tags normalisiert die API — hier entstehen nur rohe Zeilen.
   */
  function parseRows(raw: string): Record<string, string>[] {
    const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l.length);
    if (lines.length < 2) return [];
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[FIELD_ALIASES[h] ?? h] = values[i] || ""));
      return row;
    });
  }

  async function handleImport() {
    const rows = parseRows(csv.trim());
    setError(null);
    if (rows.length === 0) {
      setResult({ added: 0, skipped: 0 });
      return;
    }
    setBusy(true);
    try {
      const typ: EntityTyp = target === "koop" ? "kooperation" : "kunde";
      setResult(await importRows(typ, rows));
      setCsv("");
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Import fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!confirm("Alle Daten wirklich löschen und Beispieldaten neu laden?")) return;
    setBusy(true);
    setError(null);
    try {
      await resetAllData();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Zurücksetzen fehlgeschlagen.");
      setBusy(false);
    }
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
                <button
                  onClick={handleImport}
                  disabled={busy}
                  className={`${buttonPrimaryClass} disabled:opacity-50`}
                >
                  {busy ? "Importiert…" : "Importieren"}
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
              {error && <div className="mt-4"><StateBanner loading={false} error={error} /></div>}
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
                disabled={busy}
                className={`w-full ${buttonSecondaryClass} text-accent disabled:opacity-50`}
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
