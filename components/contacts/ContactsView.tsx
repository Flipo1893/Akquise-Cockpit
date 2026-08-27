"use client";

import { useState, useTransition, type ReactNode } from "react";
import ListToolbar from "@/components/ListToolbar";
import Modal from "@/components/ui/Modal";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import {
  createContact,
  deleteContact,
  setNextAction,
  updateStatus,
} from "@/app/actions/contacts";
import { fmtDate } from "@/lib/format";
import { statusColor, type StatusDef } from "@/lib/status";
import type { Entity, EntityTyp } from "@/lib/types";
import { useContacts } from "@/lib/useContacts";
import { useEntityFilters } from "@/lib/useEntityFilters";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  inputClass,
  selectClass,
} from "@/lib/ui";

export interface ContactsConfig {
  typ: EntityTyp;
  titel: string;
  /** Wird als "<n> von <m> …" angehängt, z.B. "Kontakten". */
  zaehlerLabel: string;
  neuLabel: string;
  modalTitel: string;
  leerText: string;
  loeschenLabel: string;
  statusList: StatusDef[];
  spalte1Label: string;
  spalte3Label: string;
  spalte3Wert: (c: Entity) => string;
  renderKontaktDetails: (c: Entity) => ReactNode;
  renderMitteDetails: (c: Entity) => ReactNode;
  modalFelder: ReactNode;
}

export default function ContactsView({
  config,
  initial,
}: {
  config: ContactsConfig;
  initial: Entity[];
}) {
  const { list: all, apply, remove } = useContacts(config.typ, initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { search, setSearch, status, setStatus, priority, setPriority, filtered } =
    useEntityFilters(all);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createContact(config.typ, formData);
      if (!res.ok || !res.entity) {
        setFehler(res.error ?? "Unbekannter Fehler.");
        return;
      }
      apply(res.entity);
      setFehler(null);
      setModalOpen(false);
    });
  }

  function handleStatus(id: string, neuerStatus: string) {
    startTransition(async () => {
      const res = await updateStatus(id, neuerStatus);
      if (!res.ok || !res.entity) return setFehler(res.error ?? "Unbekannter Fehler.");
      apply(res.entity);
      setFehler(null);
    });
  }

  function handleNextDate(id: string, datum: string) {
    startTransition(async () => {
      const res = await setNextAction(id, datum);
      if (!res.ok || !res.entity) return setFehler(res.error ?? "Unbekannter Fehler.");
      apply(res.entity);
      setFehler(null);
    });
  }

  function handleDelete(id: string, firma: string) {
    if (!confirm(`${firma} wirklich löschen?`)) return;
    startTransition(async () => {
      const res = await deleteContact(id);
      if (!res.ok) return setFehler(res.error ?? "Unbekannter Fehler.");
      remove(id);
      setExpandedId(null);
      setFehler(null);
    });
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{config.titel}</h1>
            <p className="mt-0.5 text-sm text-mute">
              {filtered.length} von {all.length} {config.zaehlerLabel}
            </p>
          </div>
          <button onClick={() => setModalOpen(true)} className={buttonPrimaryClass}>
            {config.neuLabel}
          </button>
        </div>

        {fehler && (
          <div className="mb-4 rounded-md border border-line bg-accent-soft px-3 py-2 text-sm text-accent-2">
            {fehler}
          </div>
        )}

        <ListToolbar
          search={search}
          onSearch={setSearch}
          status={status}
          onStatus={setStatus}
          priority={priority}
          onPriority={setPriority}
          statusList={config.statusList}
        />

        <section
          className={`${cardClass} overflow-x-auto ${pending ? "opacity-70" : ""}`}
        >
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead className="border-b border-line bg-paper-2 text-xs uppercase tracking-wide text-mute">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">{config.spalte1Label}</th>
                <th className="px-4 py-2.5 text-left font-medium">Kontakt</th>
                <th className="px-4 py-2.5 text-left font-medium">{config.spalte3Label}</th>
                <th className="px-4 py-2.5 text-left font-medium">Branche</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Priorität</th>
                <th className="px-4 py-2.5 text-left font-medium">Nächste Aktion</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((c) => (
                <ContactRow
                  key={c.id}
                  entity={c}
                  config={config}
                  expanded={expandedId === c.id}
                  onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  onStatusChange={(v) => handleStatus(c.id, v)}
                  onNextDate={(v) => handleNextDate(c.id, v)}
                  onDelete={() => handleDelete(c.id, c.firma)}
                />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-mute">
              {config.leerText}
            </div>
          )}
        </section>
      </main>

      <Modal open={modalOpen} title={config.modalTitel} onClose={() => setModalOpen(false)}>
        <form action={handleCreate} className="space-y-3 p-5 text-sm">
          {config.modalFelder}
          <label className="block">
            Status
            <select name="status" defaultValue="Neu" className={`mt-1 ${selectClass}`}>
              {config.statusList.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.key}
                </option>
              ))}
            </select>
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
            <button
              type="submit"
              disabled={pending}
              className={`${buttonPrimaryClass} disabled:opacity-60`}
            >
              {pending ? "Speichert…" : "Speichern"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function ContactRow({
  entity: c,
  config,
  expanded,
  onToggle,
  onStatusChange,
  onNextDate,
  onDelete,
}: {
  entity: Entity;
  config: ContactsConfig;
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
        <td className="px-4 py-3 text-mute">{config.spalte3Wert(c) || "–"}</td>
        <td className="px-4 py-3 text-mute">{c.branche || "–"}</td>
        <td className="px-4 py-3">
          <StatusBadge status={c.status} color={statusColor(config.statusList, c.status)} />
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
                {config.renderKontaktDetails(c)}
              </div>
              <div>{config.renderMitteDetails(c)}</div>
              <div>
                <div className="mb-2 text-xs uppercase tracking-wide text-mute">Aktionen</div>
                <label className="mb-1 block text-xs text-mute">Status</label>
                <select
                  value={c.status}
                  onChange={(e) => onStatusChange(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={`mb-3 ${selectClass}`}
                >
                  {config.statusList.map((s) => (
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
                  {config.loeschenLabel}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
