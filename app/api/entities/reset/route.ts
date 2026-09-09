import { handle } from "@/lib/server/apiHelpers";
import { repo } from "@/lib/server/entityRepo";

export const dynamic = "force-dynamic";

/** POST /api/entities/reset — löscht alle Kontakte und lädt Beispieldaten neu. */
export async function POST(): Promise<Response> {
  return handle(async () => {
    await (await repo()).reset();
    return Response.json({ ok: true });
  });
}
