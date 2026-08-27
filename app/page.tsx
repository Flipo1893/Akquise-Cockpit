"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import DueList, { type DueItem } from "@/components/dashboard/DueList";
import KpiGrid, { computeKpi } from "@/components/dashboard/KpiGrid";
import PeriodSwitch from "@/components/dashboard/PeriodSwitch";
import StatusDistribution from "@/components/dashboard/StatusDistribution";
import { useEntityList } from "@/lib/entityStore";
import { isoDay } from "@/lib/format";
import { STATUS_KOOP, STATUS_KUNDEN } from "@/lib/status";
import { cardClass } from "@/lib/ui";

export default function DashboardPage() {
  const kunden = useEntityList("kunde");
  const koop = useEntityList("kooperation");
  const [periodDays, setPeriodDays] = useState(30);

  const kpiKunden = useMemo(() => computeKpi(kunden, periodDays), [kunden, periodDays]);
  const kpiKoop = useMemo(() => computeKpi(koop, periodDays), [koop, periodDays]);

  const { todayList, overList } = useMemo(() => {
    const all: DueItem[] = [
      ...kunden.map((entity) => ({ entity, bereich: "kunden" as const })),
      ...koop.map((entity) => ({ entity, bereich: "koop" as const })),
    ].filter((item) => item.entity.nextAction?.datum);

    const today = isoDay(new Date());
    return {
      todayList: all.filter((item) => isoDay(item.entity.nextAction!.datum) === today),
      overList: all.filter((item) => isoDay(item.entity.nextAction!.datum) < today),
    };
  }, [kunden, koop]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-0.5 text-sm text-mute">
              Überblick über Kunden- und Kooperations-Pipeline.
            </p>
          </div>
          <PeriodSwitch value={periodDays} onChange={setPeriodDays} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className={cardClass}>
            <div className="flex items-center justify-between rounded-t-xl border-b border-line bg-paper-2 px-4 py-2.5">
              <h2 className="text-sm font-semibold">Kunden</h2>
              <Link href="/kunden" className="text-xs font-medium text-accent hover:underline">
                Zur Tabelle →
              </Link>
            </div>
            <KpiGrid kpi={kpiKunden} />
          </section>

          <section className={cardClass}>
            <div className="flex items-center justify-between rounded-t-xl border-b border-line bg-paper-2 px-4 py-2.5">
              <h2 className="text-sm font-semibold">Kooperationen</h2>
              <Link
                href="/kooperationen"
                className="text-xs font-medium text-accent hover:underline"
              >
                Zur Tabelle →
              </Link>
            </div>
            <KpiGrid kpi={kpiKoop} />
          </section>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className={`${cardClass} p-4`}>
            <h3 className="mb-3 text-sm font-semibold">Status-Verteilung Kunden</h3>
            <StatusDistribution list={kunden} statusList={STATUS_KUNDEN} />
          </section>
          <section className={`${cardClass} p-4`}>
            <h3 className="mb-3 text-sm font-semibold">Status-Verteilung Kooperationen</h3>
            <StatusDistribution list={koop} statusList={STATUS_KOOP} />
          </section>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className={cardClass}>
            <div className="flex items-center justify-between rounded-t-xl border-b border-line bg-paper-2 px-4 py-2.5">
              <h3 className="text-sm font-semibold">Heute fällig</h3>
              <span className="font-mono text-xs text-mute">{todayList.length}</span>
            </div>
            <DueList items={todayList} emptyLabel="Nichts fällig heute." />
          </section>
          <section className={cardClass}>
            <div className="flex items-center justify-between rounded-t-xl border-b border-line bg-paper-2 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-accent">Überfällig</h3>
              <span className="font-mono text-xs text-mute">{overList.length}</span>
            </div>
            <DueList items={overList} emptyLabel="Keine Überfälligen." />
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
