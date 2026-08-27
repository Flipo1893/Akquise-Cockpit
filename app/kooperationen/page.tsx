"use client";

import { useState } from "react";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import ListToolbar from "@/components/ListToolbar";
import Modal from "@/components/ui/Modal";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { koopStore, useEntityList } from "@/lib/entityStore";
import { fmtDate } from "@/lib/format";
import { STATUS_KOOP, statusColor } from "@/lib/status";
import type { Entity, Priority } from "@/lib/types";
import { useEntityFilters } from "@/lib/useEntityFilters";
import { buttonPrimaryClass, buttonSecondaryClass, cardClass, inputClass, selectClass } from "@/lib/ui";

export default function KooperationenPage() {
  const all = useEntityList("kooperation");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { search, setSearch, status, setStatus, priority, setPriority, filtered } =
    useEntityFilters(all);

  function updateEntity(id: string, patch: Partial<Entity>) {
    const list = koopStore.getSnapshot();
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const next = [...list];
    next[idx] = { ...next[idx], ...patch };
    koopStore.set(next);
  }

  function deleteEntity(id: string, firma: string) {
    if (!confirm(`${firma} wirklich löschen?`)) return;
    koopStore.set(koopStore.getSnapshot().filter((c) => c.id !== id));
    setExpandedId(null);
  }

  function handleStatusChange(id: string, newStatus: string) {
    const now = new Date().toISOString();
    const entity = all.find((c) => c.id === id);
    if (!entity) return;
    updateEntity(id, {
      status: newStatus,
      geändertAm: now,
      statusHistory: [...entity.statusHistory, { status: newStatus, datum: now }],
    });
  }

  function handleNextDate(id: string, dateValue: string) {
    if (!dateValue) return;
    updateEntity(id, {
      nextAction: { beschreibung: "Follow-up", datum: new Date(dateValue).toISOString() },
    });
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    const status = String(fd.get("status") || "Neu");
    const entry: Entity = {
      id: crypto.randomUUID(),
      typ: "kooperation",
      firma: String(fd.get("firma") || ""),
      kontakt: String(fd.get("kontakt") || ""),
      rolle: String(fd.get("rolle") || ""),
      email: String(fd.get("email") || ""),
      telefon: String(fd.get("telefon") || ""),
      website: String(fd.get("website") || ""),
      adresse: "",
      plz: "",
      ort: String(fd.get("ort") || ""),
      kanton: "",
      branche: String(fd.get("branche") || ""),
      quelle: "",
      status,
      priorität: (fd.get("priorität") as Priority) || "mittel",
      tags: [],
      notizen: String(fd.get("notizen") || ""),
      erstelltAm: now,
      geändertAm: now,
      history: [],
      nextAction: null,
      statusHistory: [{ status, datum: now }],
      art: String(fd.get("art") || ""),
      wirBekommen: String(fd.get("wirBekommen") || ""),
      partnerBekommt: String(fd.get("partnerBekommt") || ""),
    };
    koopStore.set([...koopStore.getSnapshot(), entry]);
    e.currentTarget.reset();
    setModalOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Kooperationen</h1>
            <p className="mt-0.5 text-sm text-mute">
              <span>{filtered.length}</span> von <span>{all.length}</span> Partnern
            </p>
          </div>
          <button onClick={() => setModalOpen(true)} className={buttonPrimaryClass}>
            + Neue Kooperation
          </button>
        </div>

        <ListToolbar
          search={search}
          onSearch={setSearch}
          status={status}
          onStatus={setStatus}
          priority={priority}
          onPriority={setPriority}
          statusList={STATUS_KOOP}
        />

        <section className={`${cardClass} overflow-x-auto`}>
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead className="border-b border-line bg-paper-2 text-xs uppercase tracking-wide text-mute">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Partner</th>
                <th className="px-4 py-2.5 text-left font-medium">Kontakt</th>
                <th className="px-4 py-2.5 text-left font-medium">Art</th>
                <th className="px-4 py-2.5 text-left font-medium">Branche</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Priorität</th>
                <th className="px-4 py-2.5 text-left font-medium">Nächste Aktion</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((c) => (
                <RowGroup
                  key={c.id}
                  entity={c}
                  expanded={expandedId === c.id}
                  onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  onStatusChange={(v) => handleStatusChange(c.id, v)}
                  onNextDate={(v) => handleNextDate(c.id, v)}
                  onDelete={() => deleteEntity(c.id, c.firma)}
                />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-mute">
              Keine Kooperationen gefunden.
            </div>
          )}
        </section>
      </main>

      <AppFooter />

      <Modal open={modalOpen} title="Neue Kooperation" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3 p-5 text-sm">
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
            Status
            <select name="status" defaultValue="Neu" className={`mt-1 ${selectClass}`}>
              {STATUS_KOOP.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.key}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Wir bekommen
            <input name="wirBekommen" className={`mt-1 ${inputClass}`} />
          </label>
          <label className="block">
            Partner bekommt
            <input name="partnerBekommt" className={`mt-1 ${inputClass}`} />
          </label>
          <label className="block">
            Notizen
            <textarea name="notizen" rows={3} className={`mt-1 ${inputClass}`} />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className={buttonSecondaryClass}
            >
              Abbrechen
            </button>
            <button type="submit" className={buttonPrimaryClass}>
              Speichern
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function RowGroup({
  entity: c,
  expanded,
  onToggle,
  onStatusChange,
  onNextDate,
  onDelete,
}: {
  entity: Entity;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (v: string) => void;
  onNextDate: (v: string) => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer transition-colors hover:bg-paper-2">
        <td className="px-4 py-3 font-medium">{c.firma}</td>
        <td className="px-4 py-3 text-mute">{c.kontakt || "–"}</td>
        <td className="px-4 py-3 text-mute">{c.art || "–"}</td>
        <td className="px-4 py-3 text-mute">{c.branche || "–"}</td>
        <td className="px-4 py-3">
          <StatusBadge status={c.status} color={statusColor(STATUS_KOOP, c.status)} />
        </td>
        <td className="px-4 py-3">
          <PriorityBadge priority={c.priorität} />
        </td>
        <td className="px-4 py-3 font-mono text-xs text-mute">
          {c.nextAction?.datum ? fmtDate(c.nextAction.datum) : "–"}
        </td>
        <td className="px-4 py-3 text-right text-xs text-mute">{expanded ? "▲" : "▼"}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-paper-2 px-5 py-4">
            <div className="grid gap-6 text-sm md:grid-cols-3">
              <div>
                <div className="mb-2 text-xs uppercase tracking-wide text-mute">Kontakt</div>
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
              </div>
              <div>
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
              </div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-wide text-mute">Aktionen</div>
                <label className="mb-1 block text-xs text-mute">Status</label>
                <select
                  value={c.status}
                  onChange={(e) => onStatusChange(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={`mb-3 ${selectClass}`}
                >
                  {STATUS_KOOP.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.key}
                    </option>
                  ))}
                </select>
                <form
                  onClick={(e) => e.stopPropagation()}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    onNextDate(String(fd.get("nextdate") || ""));
                  }}
                  className="mb-3 flex gap-1.5"
                >
                  <input
                    type="date"
                    name="nextdate"
                    defaultValue={c.nextAction?.datum ? c.nextAction.datum.slice(0, 10) : ""}
                    className={`flex-1 ${inputClass}`}
                  />
                  <button className="rounded-md border border-line px-2 py-1.5 text-xs transition-colors hover:bg-white">
                    Setzen
                  </button>
                </form>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="w-full rounded-md border border-line px-2 py-1.5 text-xs text-accent transition-colors hover:bg-white"
                >
                  Kooperation löschen
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
