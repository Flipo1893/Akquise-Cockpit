import "server-only";

import type { EntityPatch } from "@/lib/entitySchema";
import type { Entity, EntityTyp } from "@/lib/types";

export interface EntityRepo {
  list(typ: EntityTyp): Promise<Entity[]>;
  insertMany(list: Entity[]): Promise<Entity[]>;
  findById(id: string): Promise<Entity | null>;
  update(id: string, patch: EntityPatch): Promise<Entity | null>;
  remove(id: string): Promise<boolean>;
  reset(): Promise<void>;
}

let warned = false;

/**
 * MongoDB ist der Normalfall und braucht nur MONGODB_URI in .env.local.
 * AKQ_STORE=memory schaltet bewusst auf einen flüchtigen Prozess-Store um —
 * gedacht für lokale Entwicklung und E2E-Tests ohne Datenbank.
 */
export async function repo(): Promise<EntityRepo> {
  if (process.env.AKQ_STORE === "memory") {
    if (!warned) {
      warned = true;
      console.warn(
        "[akquise-cockpit] AKQ_STORE=memory — Daten liegen nur im Arbeitsspeicher und sind beim Neustart weg.",
      );
    }
    return (await import("./memoryRepo")).memoryRepo;
  }
  return (await import("./mongoRepo")).mongoRepo;
}
