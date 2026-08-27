import { priorityClass, priorityLabel } from "@/lib/status";

export function StatusBadge({ status, color }: { status: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`text-xs font-medium ${priorityClass(priority)}`}>
      {priorityLabel(priority)}
    </span>
  );
}
