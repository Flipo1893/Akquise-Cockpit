import Link from "next/link";
import { fmtDate } from "@/lib/format";
import type { Entity } from "@/lib/types";

export interface DueItem {
  entity: Entity;
  bereich: "kunden" | "koop";
}

export default function DueList({
  items,
  emptyLabel,
}: {
  items: DueItem[];
  emptyLabel: string;
}) {
  if (!items.length) {
    return <div className="px-4 py-6 text-sm text-mute">{emptyLabel}</div>;
  }

  return (
    <div className="divide-y divide-line">
      {items.map(({ entity, bereich }) => (
        <Link
          key={entity.id}
          href={bereich === "kunden" ? "/kunden" : "/kooperationen"}
          className="flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-paper-2"
        >
          <div>
            <div className="font-medium">{entity.firma}</div>
            <div className="text-xs text-mute">{entity.nextAction?.beschreibung}</div>
          </div>
          <div className="font-mono text-xs text-mute">
            {entity.nextAction ? fmtDate(entity.nextAction.datum) : ""}
          </div>
        </Link>
      ))}
    </div>
  );
}
