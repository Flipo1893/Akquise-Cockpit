import type { EntityPatch } from "@/lib/entitySchema";
import { buildSeedEntities } from "@/lib/seedData";
import type { Entity, EntityTyp } from "@/lib/types";
import type { EntityRepo } from "./entityRepo";
import { type EntityDoc, ensureIndexes, getEntities, getMeta } from "./mongo";

const SEED_MARKER = "seed";

function toDoc({ id, ...rest }: Entity): EntityDoc {
  return { _id: id, ...rest };
}

function fromDoc({ _id, ...rest }: EntityDoc): Entity {
  return { id: _id, ...rest };
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

/**
 * Füllt eine frische Datenbank einmalig mit Beispieldaten. Der Marker liegt in
 * `meta`, nicht in `entities` — wer alle Kontakte löscht, bekommt sie also
 * nicht beim nächsten Aufruf wieder untergeschoben.
 */
async function ensureSeeded(): Promise<void> {
  const meta = await getMeta();
  if (await meta.findOne({ _id: SEED_MARKER })) return;

  // Marker zuerst: schlägt der Insert mit Duplicate-Key fehl, war ein
  // paralleler Request schneller und wir lassen ihm den Vortritt.
  try {
    await meta.insertOne({ _id: SEED_MARKER, datum: new Date().toISOString() });
  } catch (err) {
    if (isDuplicateKey(err)) return;
    throw err;
  }
  try {
    const entities = await getEntities();
    await entities.insertMany(buildSeedEntities().map(toDoc));
  } catch (err) {
    // Marker zurücknehmen, damit der nächste Aufruf es erneut versuchen kann.
    await meta.deleteOne({ _id: SEED_MARKER }).catch(() => {});
    throw err;
  }
}

export const mongoRepo: EntityRepo = {
  async list(typ: EntityTyp): Promise<Entity[]> {
    await ensureIndexes();
    await ensureSeeded();
    const entities = await getEntities();
    const docs = await entities
      .find({ typ })
      .sort({ geändertAm: -1 })
      .toArray();
    return docs.map(fromDoc);
  },

  async insertMany(list: Entity[]): Promise<Entity[]> {
    if (list.length === 0) return [];
    const entities = await getEntities();
    await entities.insertMany(list.map(toDoc));
    return list;
  },

  async findById(id: string): Promise<Entity | null> {
    const entities = await getEntities();
    const doc = await entities.findOne({ _id: id });
    return doc ? fromDoc(doc) : null;
  },

  async update(id: string, patch: EntityPatch): Promise<Entity | null> {
    const entities = await getEntities();
    const current = await entities.findOne({ _id: id });
    if (!current) return null;

    const now = new Date().toISOString();
    const set: Partial<EntityDoc> = { ...patch, geändertAm: now };
    if (patch.status && patch.status !== current.status) {
      set.statusHistory = [...current.statusHistory, { status: patch.status, datum: now }];
    }
    const doc = await entities.findOneAndUpdate(
      { _id: id },
      { $set: set },
      { returnDocument: "after" },
    );
    return doc ? fromDoc(doc) : null;
  },

  async remove(id: string): Promise<boolean> {
    const entities = await getEntities();
    const { deletedCount } = await entities.deleteOne({ _id: id });
    return deletedCount === 1;
  },

  async reset(): Promise<void> {
    const entities = await getEntities();
    const meta = await getMeta();
    await entities.deleteMany({});
    await meta.deleteOne({ _id: SEED_MARKER });
    await ensureSeeded();
  },
};
