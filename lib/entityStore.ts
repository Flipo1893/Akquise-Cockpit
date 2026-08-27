"use client";

import { useSyncExternalStore } from "react";
import { seedIfNeeded } from "./seed";
import { KEY_KOOP, KEY_KUNDEN } from "./storage";
import type { Entity, EntityTyp } from "./types";

type Listener = () => void;

interface EntityStore {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => Entity[];
  getServerSnapshot: () => Entity[];
  set: (list: Entity[]) => void;
}

const EMPTY: Entity[] = [];

function createEntityStore(key: string): EntityStore {
  let cache: Entity[] | null = null;
  const listeners = new Set<Listener>();

  function readFromStorage(): Entity[] {
    if (typeof window === "undefined") return EMPTY;
    seedIfNeeded();
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return EMPTY;
    }
  }

  function getSnapshot(): Entity[] {
    if (cache === null) cache = readFromStorage();
    return cache;
  }

  function getServerSnapshot(): Entity[] {
    return EMPTY;
  }

  function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function set(list: Entity[]): void {
    cache = list;
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(list));
    }
    listeners.forEach((l) => l());
  }

  return { subscribe, getSnapshot, getServerSnapshot, set };
}

export const kundenStore = createEntityStore(KEY_KUNDEN);
export const koopStore = createEntityStore(KEY_KOOP);

export function storeFor(typ: EntityTyp): EntityStore {
  return typ === "kunde" ? kundenStore : koopStore;
}

export function useEntityList(typ: EntityTyp): Entity[] {
  const store = storeFor(typ);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
