import { buildPatch } from "@/lib/entitySchema";
import { handle, jsonBody, jsonError } from "@/lib/server/apiHelpers";
import { repo } from "@/lib/server/entityRepo";

export const dynamic = "force-dynamic";

/** PATCH /api/entities/:id — ändert einzelne Felder eines Kontakts. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const store = await repo();
    const current = await store.findById(id);
    if (!current) return jsonError("Kontakt nicht gefunden.", 404);

    // Der Typ bestimmt, welche Status-Werte gültig sind — er kommt aus dem
    // gespeicherten Dokument, nicht aus dem Request.
    const patch = buildPatch(await jsonBody(request), current.typ);
    const entity = await store.update(id, patch);
    if (!entity) return jsonError("Kontakt nicht gefunden.", 404);
    return Response.json({ entity });
  });
}

/** DELETE /api/entities/:id */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const removed = await (await repo()).remove(id);
    if (!removed) return jsonError("Kontakt nicht gefunden.", 404);
    return new Response(null, { status: 204 });
  });
}
