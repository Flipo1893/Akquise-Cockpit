import { buildEntity, isEntityTyp } from "@/lib/entitySchema";
import { handle, jsonBody, typFromQuery } from "@/lib/server/apiHelpers";
import { repo } from "@/lib/server/entityRepo";
import { ValidationError } from "@/lib/entitySchema";

export const dynamic = "force-dynamic";

/** GET /api/entities?typ=kunde — alle Kontakte eines Bereichs. */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const typ = typFromQuery(request);
    const entities = await (await repo()).list(typ);
    return Response.json({ entities });
  });
}

/** POST /api/entities — legt einen Kontakt an. `typ` kommt aus dem Body. */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const body = await jsonBody(request);
    const typ = (body as { typ?: unknown })?.typ;
    if (!isEntityTyp(typ)) {
      throw new ValidationError("Feld 'typ' muss 'kunde' oder 'kooperation' sein.");
    }
    const entity = buildEntity(body, typ);
    await (await repo()).insertMany([entity]);
    return Response.json({ entity }, { status: 201 });
  });
}
