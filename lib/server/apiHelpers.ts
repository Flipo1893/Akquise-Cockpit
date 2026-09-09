import "server-only";

import { ValidationError, isEntityTyp } from "@/lib/entitySchema";
import type { EntityTyp } from "@/lib/types";

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/** Liest und prüft den `typ`-Query-Parameter einer Listen-/Import-Route. */
export function typFromQuery(request: Request): EntityTyp {
  const value = new URL(request.url).searchParams.get("typ");
  if (!isEntityTyp(value)) {
    throw new ValidationError("Query-Parameter 'typ' muss 'kunde' oder 'kooperation' sein.");
  }
  return value;
}

export async function jsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request-Body ist kein gültiges JSON.");
  }
}

/**
 * Fehlt die Konfiguration ganz, hilft die Originalmeldung weiter — sie nennt
 * die Variable und die Vorlagendatei. Bei allen anderen Verbindungsproblemen
 * bleibt es bei einem generischen Hinweis.
 */
function connectionMessage(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  if (err.message.includes("MONGODB_URI")) return err.message;
  if (
    err.name === "MongoServerSelectionError" ||
    err.name === "MongoNetworkError" ||
    err.name === "MongoParseError"
  ) {
    return "Datenbank nicht erreichbar. Läuft MongoDB und ist MONGODB_URI korrekt gesetzt?";
  }
  return null;
}

/**
 * Einheitliche Fehlerbehandlung für alle Route Handler: Validierungsfehler
 * werden zu 400, eine nicht erreichbare Datenbank zu 503 mit lesbarem Hinweis,
 * alles andere zu 500 (Details nur ins Server-Log, nicht in die Antwort).
 */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ValidationError) return jsonError(err.message, 400);
    const connection = connectionMessage(err);
    if (connection) {
      console.error("[akquise-cockpit] Datenbank nicht erreichbar:", err);
      return jsonError(connection, 503);
    }
    console.error("[akquise-cockpit] Unerwarteter Fehler:", err);
    return jsonError("Unerwarteter Serverfehler.", 500);
  }
}
