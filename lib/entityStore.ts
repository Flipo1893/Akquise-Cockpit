"use client";

import { useSyncExternalStore } from "react";
import type { EntityPatch } from "./entitySchema";
import type { Entity, EntityTyp } from "./types";

export interface EntityState {
  entities: Entity[];
  loading: boolean;
  error: string | null;
}

const INITIAL: EntityState = { entities: [], loading: true, error: null };
const SERVER: EntityState = { entities: [], loading: true, error: null };

type Listener = () => void;

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error) return body.error;
  } catch {
    // Antwort ohne JSON-Body — Fallback verwenden.
  }
  return fallback;
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error("Server nicht erreichbar.");
  }
  if (!res.ok) throw new Error(await readError(res, `Fehler ${res.status}`));
  return res;
}

function createStore(typ: EntityTyp) {
  let state: EntityState = INITIAL;
  const listeners = new Set<Listener>();
  let started = false;

  function emit(next: EntityState) {
    state = next;
    listeners.forEach((l) => l());
  }

  async function load(): Promise<void> {
    emit({ ...state, loading: true, error: null });
    try {
      const res = await request(`/api/entities?typ=${typ}`);
      const { entities } = (await res.json()) as { entities: Entity[] };
      emit({ entities, loading: false, error: null });
    } catch (err) {
      emit({
        ...state,
        loading: false,
        error: err instanceof Error ? err.message : "Unbekannter Fehler.",
      });
    }
  }

  return {
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      // Erst laden, wenn die Liste tatsächlich jemand anzeigt.
      if (!started) {
        started = true;
        void load();
      }
      return () => listeners.delete(listener);
    },
    getSnapshot: (): EntityState => state,
    getServerSnapshot: (): EntityState => SERVER,
    reload: load,
  };
}

const stores: Record<EntityTyp, ReturnType<typeof createStore>> = {
  kunde: createStore("kunde"),
  kooperation: createStore("kooperation"),
};

export function useEntityState(typ: EntityTyp): EntityState {
  const store = stores[typ];
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function reloadEntities(typ: EntityTyp): Promise<void> {
  return stores[typ].reload();
}

/**
 * Nach jeder Mutation wird neu geladen statt lokal gepatcht: Sortierung,
 * `geändertAm` und die Status-Historie bestimmt der Server, nicht der Client.
 */
export async function createEntity(typ: EntityTyp, draft: Record<string, unknown>): Promise<void> {
  await request("/api/entities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...draft, typ }),
  });
  await stores[typ].reload();
}

export async function updateEntity(
  typ: EntityTyp,
  id: string,
  patch: EntityPatch,
): Promise<void> {
  await request(`/api/entities/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  await stores[typ].reload();
}

export async function deleteEntity(typ: EntityTyp, id: string): Promise<void> {
  await request(`/api/entities/${encodeURIComponent(id)}`, { method: "DELETE" });
  await stores[typ].reload();
}

export async function importRows(
  typ: EntityTyp,
  rows: Record<string, string>[],
): Promise<{ added: number; skipped: number }> {
  const res = await request(`/api/entities/import?typ=${typ}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  const result = (await res.json()) as { added: number; skipped: number };
  await stores[typ].reload();
  return result;
}

export async function resetAllData(): Promise<void> {
  await request("/api/entities/reset", { method: "POST" });
  await Promise.all([stores.kunde.reload(), stores.kooperation.reload()]);
}
