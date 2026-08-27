"use client";

import ContactsView, { type ContactsConfig } from "@/components/contacts/ContactsView";
import { fmtDate } from "@/lib/format";
import { STATUS_KUNDEN } from "@/lib/status";
import type { Entity } from "@/lib/types";
import { inputClass, selectClass } from "@/lib/ui";

const config: ContactsConfig = {
  typ: "kunde",
  titel: "Kunden",
  zaehlerLabel: "Kontakten",
  neuLabel: "+ Neuer Kunde",
  modalTitel: "Neuer Kunde",
  leerText: "Keine Kontakte gefunden.",
  loeschenLabel: "Kontakt löschen",
  statusList: STATUS_KUNDEN,
  spalte1Label: "Firma",
  spalte3Label: "Ort",
  spalte3Wert: (c) => c.ort,

  renderKontaktDetails: (c: Entity) => (
    <div className="space-y-1">
      <div>
        <span className="text-mute">Person:</span> {c.kontakt || "–"}
        {c.rolle ? ` (${c.rolle})` : ""}
      </div>
      <div>
        <span className="text-mute">E-Mail:</span>{" "}
        {c.email ? (
          <a className="text-accent hover:underline" href={`mailto:${c.email}`}>
            {c.email}
          </a>
        ) : (
          "–"
        )}
      </div>
      <div>
        <span className="text-mute">Telefon:</span> {c.telefon || "–"}
      </div>
      <div>
        <span className="text-mute">Website:</span> {c.website || "–"}
      </div>
      <div>
        <span className="text-mute">Adresse:</span>{" "}
        {[c.adresse, c.plz, c.ort, c.kanton].filter(Boolean).join(", ") || "–"}
      </div>
      <div>
        <span className="text-mute">Quelle:</span> {c.quelle || "–"}
      </div>
      {c.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {c.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-line bg-white px-2 py-0.5 text-xs"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  ),

  renderMitteDetails: (c: Entity) => (
    <>
      <div className="mb-2 text-xs uppercase tracking-wide text-mute">
        Notizen &amp; Verlauf
      </div>
      <p className="mb-3 text-ink/90">{c.notizen || "Keine Notizen."}</p>
      <div className="max-h-32 space-y-1.5 overflow-y-auto pr-1">
        {c.history.length ? (
          [...c.history].reverse().map((h, i) => (
            <div key={i} className="border-l-2 border-line pl-2">
              <div className="font-mono text-xs text-mute">
                {fmtDate(h.datum)} · {h.kanal} ·{" "}
                {h.richtung === "raus" ? "gesendet" : "erhalten"}
              </div>
              <div className="text-xs">{h.betreff || ""}</div>
            </div>
          ))
        ) : (
          <div className="text-xs text-mute">Keine Einträge.</div>
        )}
      </div>
    </>
  ),

  modalFelder: (
    <div className="grid grid-cols-2 gap-3">
      <label className="col-span-2">
        Firma*
        <input required name="firma" className={`mt-1 ${inputClass}`} />
      </label>
      <label>
        Kontakt
        <input name="kontakt" className={`mt-1 ${inputClass}`} />
      </label>
      <label>
        Rolle
        <input name="rolle" className={`mt-1 ${inputClass}`} />
      </label>
      <label>
        E-Mail
        <input type="email" name="email" className={`mt-1 ${inputClass}`} />
      </label>
      <label>
        Telefon
        <input name="telefon" className={`mt-1 ${inputClass}`} />
      </label>
      <label>
        Website
        <input name="website" className={`mt-1 ${inputClass}`} />
      </label>
      <label>
        Branche
        <input name="branche" className={`mt-1 ${inputClass}`} />
      </label>
      <label>
        PLZ
        <input name="plz" className={`mt-1 ${inputClass}`} />
      </label>
      <label>
        Ort
        <input name="ort" className={`mt-1 ${inputClass}`} />
      </label>
      <label>
        Kanton
        <input name="kanton" className={`mt-1 ${inputClass}`} />
      </label>
      <label>
        Quelle
        <input name="quelle" className={`mt-1 ${inputClass}`} />
      </label>
      <label>
        Priorität
        <select name="priorität" defaultValue="mittel" className={`mt-1 ${selectClass}`}>
          <option value="tief">Tief</option>
          <option value="mittel">Mittel</option>
          <option value="hoch">Hoch</option>
        </select>
      </label>
    </div>
  ),
};

export default function KundenView({ initial }: { initial: Entity[] }) {
  return <ContactsView config={config} initial={initial} />;
}
