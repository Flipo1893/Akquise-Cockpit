"use client";

import ContactsView, { type ContactsConfig } from "@/components/contacts/ContactsView";
import { STATUS_KOOP } from "@/lib/status";
import type { Entity } from "@/lib/types";
import { inputClass, selectClass } from "@/lib/ui";

const config: ContactsConfig = {
  typ: "kooperation",
  titel: "Kooperationen",
  zaehlerLabel: "Partnern",
  neuLabel: "+ Neue Kooperation",
  modalTitel: "Neue Kooperation",
  leerText: "Keine Kooperationen gefunden.",
  loeschenLabel: "Kooperation löschen",
  statusList: STATUS_KOOP,
  spalte1Label: "Partner",
  spalte3Label: "Art",
  spalte3Wert: (c) => c.art ?? "",

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
        <span className="text-mute">Ort:</span>{" "}
        {[c.ort, c.kanton].filter(Boolean).join(", ") || "–"}
      </div>
    </div>
  ),

  renderMitteDetails: (c: Entity) => (
    <>
      <div className="mb-2 text-xs uppercase tracking-wide text-mute">Vereinbarung</div>
      <div className="mb-3 space-y-1">
        <div>
          <span className="text-mute">Art:</span> {c.art || "–"}
        </div>
        <div>
          <span className="text-mute">Wir bekommen:</span> {c.wirBekommen || "–"}
        </div>
        <div>
          <span className="text-mute">Partner bekommt:</span> {c.partnerBekommt || "–"}
        </div>
      </div>
      <div className="mb-1 text-xs uppercase tracking-wide text-mute">Notizen</div>
      <p className="text-ink/90">{c.notizen || "Keine Notizen."}</p>
    </>
  ),

  modalFelder: (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2">
          Firma/Partner*
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
          Ort
          <input name="ort" className={`mt-1 ${inputClass}`} />
        </label>
        <label>
          Art der Kooperation
          <input
            name="art"
            placeholder="z.B. Reseller, Sponsoring"
            className={`mt-1 ${inputClass}`}
          />
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
      <label className="block">
        Wir bekommen
        <input name="wirBekommen" className={`mt-1 ${inputClass}`} />
      </label>
      <label className="block">
        Partner bekommt
        <input name="partnerBekommt" className={`mt-1 ${inputClass}`} />
      </label>
    </>
  ),
};

export default function KooperationenView({ initial }: { initial: Entity[] }) {
  return <ContactsView config={config} initial={initial} />;
}
