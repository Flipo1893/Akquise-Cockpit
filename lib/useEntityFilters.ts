"use client";

import { useMemo, useState } from "react";
import type { Entity } from "./types";

export function useEntityFilters(all: Entity[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = all.filter((c) => {
      if (status && c.status !== status) return false;
      if (priority && c.priorität !== priority) return false;
      if (q) {
        const hay = `${c.firma} ${c.kontakt} ${c.ort} ${c.branche}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort(
      (a, b) => new Date(b.geändertAm).getTime() - new Date(a.geändertAm).getTime(),
    );
  }, [all, search, status, priority]);

  return { search, setSearch, status, setStatus, priority, setPriority, filtered };
}
