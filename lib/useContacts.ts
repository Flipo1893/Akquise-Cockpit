"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { rowToEntity } from "./mappers";
import { createClient } from "./supabase/client";
import type { ContactRow } from "./supabase/database.types";
import type { Entity, EntityTyp } from "./types";

/**
 * Hält die Liste für einen Typ aktuell.
 *
 * Der erste Datenstand kommt serverseitig gerendert herein (`initial`), danach
 * hält ein Realtime-Abo die Liste über Geräte und Tabs hinweg synchron.
 * Eigene Änderungen werden zusätzlich sofort lokal eingespielt, damit die UI
 * auch dann reagiert, wenn die Realtime-Verbindung gerade hängt — das Mergen
 * läuft über die id und ist deshalb idempotent.
 */
export function useContacts(typ: EntityTyp, initial: Entity[]) {
  const [list, setList] = useState<Entity[]>(initial);
  const supabase = useMemo(() => createClient(), []);

  const apply = useCallback((entity: Entity) => {
    setList((prev) => {
      const idx = prev.findIndex((c) => c.id === entity.id);
      if (idx < 0) return [...prev, entity];
      const next = [...prev];
      next[idx] = entity;
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setList((prev) => prev.filter((c) => c.id !== id));
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`contacts:${typ}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contacts",
          filter: `typ=eq.${typ}`,
        },
        (payload) => {
          // setState im Callback eines externen Systems — genau der Fall,
          // für den useEffect-Subscriptions gedacht sind.
          if (payload.eventType === "DELETE") {
            const old = payload.old as Partial<ContactRow>;
            if (old?.id) remove(old.id);
            return;
          }
          apply(rowToEntity(payload.new as ContactRow));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, typ, apply, remove]);

  return { list, apply, remove };
}
