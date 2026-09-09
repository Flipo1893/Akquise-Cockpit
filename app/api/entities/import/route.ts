import { ValidationError, buildEntity } from "@/lib/entitySchema";
import { handle, jsonBody, typFromQuery } from "@/lib/server/apiHelpers";
import { repo } from "@/lib/server/entityRepo";
import type { Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_ROWS = 5000;

/**
 * POST /api/entities/import?typ=kunde
 * Body: { rows: Record<string, string>[] } — bereits geparste CSV-Zeilen.
 * Zeilen ohne Firma werden gezählt und übersprungen, statt den ganzen Import
 * scheitern zu lassen.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const typ = typFromQuery(request);
    const body = await jsonBody(request);
    const rows = (body as { rows?: unknown })?.rows;
    if (!Array.isArray(rows)) {
      throw new ValidationError("Feld 'rows' muss ein Array sein.");
    }
    if (rows.length > MAX_ROWS) {
      throw new ValidationError(`Zu viele Zeilen auf einmal (max. ${MAX_ROWS}).`);
    }

    const entities: Entity[] = [];
    let skipped = 0;
    for (const row of rows) {
      try {
        entities.push(buildEntity(row, typ));
      } catch (err) {
        if (err instanceof ValidationError) skipped++;
        else throw err;
      }
    }
    await (await repo()).insertMany(entities);
    return Response.json({ added: entities.length, skipped }, { status: 201 });
  });
}
