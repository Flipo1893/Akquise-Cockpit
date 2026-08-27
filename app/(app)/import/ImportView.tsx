"use client";

import { useMemo, useState, useTransition } from "react";
import { importContacts } from "@/app/actions/contacts";
import { STATUS_KOOP, STATUS_KUNDEN } from "@/lib/status";
import type { Entity, EntityTyp, Priority } from "@/lib/types";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  inputClass,
  selectClass,
} from "@/lib/ui";

type Target = "kunden" | "koop";

const COLS_KUNDEN = [
  "firma", "kontakt", "rolle", "email", "telefon", "website", "adresse", "plz", "ort",
  "kanton", "branche", "quelle", "status", "priorität", "tags", "notizen",
];
const COLS_KOOP = [...COLS_KUNDEN, "art", "wirBekommen", "partnerBekommt"];

const LEGACY_KEYS: Record<Target, string> = {
  kunden: "crm_kunden",
  koop: "crm_koop",
};

function typFor(target: Target): EntityTyp {
  return target === "koop" ? "kooperation" : "kunde";
}

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

/** Baut ein Entity aus einer CSV-Zeile und normalisiert Status und Priorität. */
function rowToEntity(row: Record<string, string>, target: Target): Entity {
  const typ = typFor(target);
  const statusKeys = (target === "koop" ? STATUS_KOOP : STATUS_KUNDEN).map((s) => s.key);
  const now = new Date().toISOString();

  let status = row.status || "Neu";
  if (!statusKeys.includes(status)) status = "Neu";

  let prio = (row["priorität"] || row["prioritat"] || "mittel").toLowerCase();
  if (!["hoch", "mittel", "tief"].includes(prio)) prio = "mittel";

  return {
    id: "",
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
    ...(typ === "kooperation"
      ? {
          art: row.art || "",
          wirBekommen: row.wirbekommen || "",
          partnerBekommt: row.partnerbekommt || "",
        }
      : {}),
  };
}

export default function ImportView() {
  const [target, setTarget] = useState<Target>("kunden");
  const [csv, setCsv] = useState("");
  const [meldung, setMeldung] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cols = target === "koop" ? COLS_KOOP : COLS_KUNDEN;
  const downloadHref = useMemo(
    () => "data:text/csv;charset=utf-8," + encodeURIComponent(buildTemplate(target)),
    [target],
  );

  function handleImport() {
    const raw = csv.trim();
    if (!raw) {
      setFehler("Bitte zuerst CSV-Daten einfügen.");
      setMeldung(null);
      return;
    }

    const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l.length);
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());

    let skipped = 0;
    const entities: Entity[] = [];

    lines.slice(1).forEach((line) => {
      const values = parseCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = values[i] || ""));
      if (!row.firma) {
        skipped++;
        return;
      }
      entities.push(rowToEntity(row, target));
    });

    startTransition(async () => {
      const res = await importContacts(typFor(target), entities);
      if (!res.ok) {
        setFehler(res.error ?? "Import fehlgeschlagen.");
        setMeldung(null);
        return;
      }
      setFehler(null);
      setMeldung(
        `${res.added} Einträge importiert` +
          (skipped ? `, ${skipped} übersprungen (Firma fehlt)` : "") +
          `. Ziel: ${target === "koop" ? "Kooperationen" : "Kunden"}.`,
      );
      setCsv("");
    });
  }

  /** Einmalige Übernahme der Daten aus der localStorage-Version des Prototyps. */
  function handleLegacyImport() {
    let kunden: Entity[] = [];
    let koop: Entity[] = [];
    try {
      kunden = JSON.parse(localStorage.getItem(LEGACY_KEYS.kunden) || "[]");
      koop = JSON.parse(localStorage.getItem(LEGACY_KEYS.koop) || "[]");
    } catch {
      setFehler("Die lokalen Daten liessen sich nicht lesen.");
      return;
    }

    if (!kunden.length && !koop.length) {
      setFehler("In diesem Browser sind keine alten Daten gespeichert.");
      setMeldung(null);
      return;
    }

    if (
      !confirm(
        `${kunden.length} Kunden und ${koop.length} Kooperationen in dein Konto übernehmen?`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const [resK, resP] = await Promise.all([
        importContacts("kunde", kunden),
        importContacts("kooperation", koop),
      ]);

      if (!resK.ok || !resP.ok) {
        setFehler(resK.error ?? resP.error ?? "Übernahme fehlgeschlagen.");
        return;
      }

      // Erst nach erfolgreicher Übernahme lokal aufräumen.
      localStorage.removeItem(LEGACY_KEYS.kunden);
      localStorage.removeItem(LEGACY_KEYS.koop);
      localStorage.removeItem("crm_seeded");

      setFehler(null);
      setMeldung(
        `${resK.added} Kunden und ${resP.added} Kooperationen übernommen. ` +
          `Die lokale Kopie wurde entfernt.`,
      );
    });
  }

  return (
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
                  disabled={pending}
                  className={`${buttonPrimaryClass} disabled:opacity-60`}
                >
                  {pending ? "Importiert…" : "Importieren"}
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
              {meldung && (
                <div className="mt-4 rounded-md border border-line bg-paper-2 px-3 py-2 text-sm">
                  {meldung}
                </div>
              )}
              {fehler && (
                <div className="mt-4 rounded-md border border-line bg-accent-soft px-3 py-2 text-sm text-accent-2">
                  {fehler}
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
                <li>Maximal 2000 Zeilen pro Import.</li>
              </ul>
            </section>

            <section className={`${cardClass} p-4`}>
              <h3 className="mb-2 text-sm font-semibold">Alte lokale Daten</h3>
              <p className="mb-3 text-xs text-mute">
                Hast du im alten Prototyp Kontakte erfasst, liegen die noch im Speicher
                dieses Browsers. Hier übernimmst du sie einmalig in dein Konto.
              </p>
              <button
                onClick={handleLegacyImport}
                disabled={pending}
                className={`w-full ${buttonSecondaryClass} disabled:opacity-60`}
              >
                Lokale Daten übernehmen
              </button>
            </section>
          </aside>
        </div>
    </main>
  );
}
