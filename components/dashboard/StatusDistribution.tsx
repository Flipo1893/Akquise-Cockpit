import type { StatusDef } from "@/lib/status";
import type { Entity } from "@/lib/types";

export default function StatusDistribution({
  list,
  statusList,
}: {
  list: Entity[];
  statusList: StatusDef[];
}) {
  const counts = statusList.map((s) => list.filter((c) => c.status === s.key).length);
  const max = Math.max(1, ...counts);

  return (
    <div className="space-y-1.5">
      {statusList.map((s, i) => {
        const count = counts[i];
        const pct = Math.round((count / max) * 100);
        return (
          <div key={s.key} className="flex items-center gap-3 text-sm">
            <div className="w-40 shrink-0 truncate text-mute">{s.key}</div>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-paper-2">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: s.color }}
              />
            </div>
            <div className="w-6 text-right font-mono text-xs">{count}</div>
          </div>
        );
      })}
    </div>
  );
}
