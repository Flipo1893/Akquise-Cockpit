"use client";

import { useSyncExternalStore } from "react";
import { fmtDate, fmtTime } from "@/lib/format";

function subscribe(listener: () => void): () => void {
  const id = setInterval(listener, 30000);
  return () => clearInterval(id);
}

function getSnapshot(): string {
  const now = new Date();
  return `${fmtDate(now)} · ${fmtTime(now)}`;
}

function getServerSnapshot(): string {
  return "";
}

export default function Clock() {
  const label = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <span className="font-mono text-xs">{label}</span>;
}
