import { MongoClient, type Collection, type Db } from "mongodb";
import type { Entity } from "@/lib/types";

const DEFAULT_DB = "akquise-cockpit";
export const ENTITIES_COLLECTION = "entities";
export const META_COLLECTION = "meta";

/** Wie ein Kontakt in MongoDB liegt: `id` aus dem UI ist die `_id` des Dokuments. */
export type EntityDoc = Omit<Entity, "id"> & { _id: string };

export interface MetaDoc {
  _id: string;
  datum: string;
}

declare global {
  // Über HMR-Reloads hinweg gecacht, damit `next dev` nicht bei jeder
  // Dateiänderung einen neuen Connection-Pool öffnet.
  var __akqMongoClient: Promise<MongoClient> | undefined;
}

let moduleClient: Promise<MongoClient> | undefined;

function uri(): string {
  const value = process.env.MONGODB_URI;
  if (!value) {
    throw new Error(
      "MONGODB_URI ist nicht gesetzt. Verbindung in .env.local eintragen (Vorlage: .env.example).",
    );
  }
  return value;
}

function clientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    return (globalThis.__akqMongoClient ??= new MongoClient(uri()).connect());
  }
  return (moduleClient ??= new MongoClient(uri()).connect());
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(process.env.MONGODB_DB || DEFAULT_DB);
}

export async function getEntities(): Promise<Collection<EntityDoc>> {
  return (await getDb()).collection<EntityDoc>(ENTITIES_COLLECTION);
}

export async function getMeta(): Promise<Collection<MetaDoc>> {
  return (await getDb()).collection<MetaDoc>(META_COLLECTION);
}

let indexesReady: Promise<void> | undefined;

/**
 * Legt die Indizes an, auf die Listen- und Dashboard-Abfragen sich stützen.
 * Läuft einmal pro Prozess; `createIndex` ist idempotent.
 */
export function ensureIndexes(): Promise<void> {
  indexesReady ??= (async () => {
    const entities = await getEntities();
    await entities.createIndex({ typ: 1, geändertAm: -1 });
    await entities.createIndex({ typ: 1, status: 1 });
  })().catch((err: unknown) => {
    indexesReady = undefined;
    throw err;
  });
  return indexesReady;
}
