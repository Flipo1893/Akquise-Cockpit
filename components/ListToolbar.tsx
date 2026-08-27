"use client";

import type { StatusDef } from "@/lib/status";
import { inputClass, selectClass } from "@/lib/ui";

export default function ListToolbar({
  search,
  onSearch,
  status,
  onStatus,
  priority,
  onPriority,
  statusList,
}: {
  search: string;
  onSearch: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  priority: string;
  onPriority: (v: string) => void;
  statusList: StatusDef[];
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Suche: Firma, Kontakt, Ort, Branche…"
        className={`min-w-[220px] flex-1 ${inputClass}`}
      />
      <select
        value={status}
        onChange={(e) => onStatus(e.target.value)}
        className={`w-auto ${selectClass}`}
      >
        <option value="">Alle Status</option>
        {statusList.map((s) => (
          <option key={s.key} value={s.key}>
            {s.key}
          </option>
        ))}
      </select>
      <select
        value={priority}
        onChange={(e) => onPriority(e.target.value)}
        className={`w-auto ${selectClass}`}
      >
        <option value="">Alle Prioritäten</option>
        <option value="hoch">Hoch</option>
        <option value="mittel">Mittel</option>
        <option value="tief">Tief</option>
      </select>
    </div>
  );
}
