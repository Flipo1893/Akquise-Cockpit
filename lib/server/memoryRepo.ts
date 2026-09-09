import type { EntityPatch } from "@/lib/entitySchema";
import { buildSeedEntities } from "@/lib/seedData";
import type { Entity, EntityTyp } from "@/lib/types";
import type { EntityRepo } from "./entityRepo";

declare global {
  var __akqMemoryStore: Entity[] | undefined;
}

function store(): Entity[] {
  return (globalThis.__akqMemoryStore ??= buildSeedEntities());
}

/**
 * Prozessinterner Ersatz-Store für Entwicklung und E2E-Tests ohne laufende
 * MongoDB. Nur aktiv, wenn AKQ_STORE=memory gesetzt ist — die Daten sind beim
 * nächsten Serverstart weg und werden nie geteilt.
 */
export const memoryRepo: EntityRepo = {
  async list(typ: EntityTyp): Promise<Entity[]> {
    return store()
      .filter((e) => e.typ === typ)
      .sort((a, b) => new Date(b.geändertAm).getTime() - new Date(a.geändertAm).getTime())
      .map((e) => structuredClone(e));
  },

  async insertMany(list: Entity[]): Promise<Entity[]> {
    store().push(...list.map((e) => structuredClone(e)));
    return list;
  },

  async findById(id: string): Promise<Entity | null> {
    const found = store().find((e) => e.id === id);
    return found ? structuredClone(found) : null;
  },

  async update(id: string, patch: EntityPatch): Promise<Entity | null> {
    const list = store();
    const current = list.find((e) => e.id === id);
    if (!current) return null;

    const now = new Date().toISOString();
    const previousStatus = current.status;
    Object.assign(current, patch, { geändertAm: now });
    if (patch.status && patch.status !== previousStatus) {
      current.statusHistory = [...current.statusHistory, { status: patch.status, datum: now }];
    }
    return structuredClone(current);
  },

  async remove(id: string): Promise<boolean> {
    const list = store();
    const idx = list.findIndex((e) => e.id === id);
    if (idx < 0) return false;
    list.splice(idx, 1);
    return true;
  },

  async reset(): Promise<void> {
    globalThis.__akqMemoryStore = buildSeedEntities();
  },
};
