"use client";

const OPTIONS: { days: number; label: string }[] = [
  { days: 7, label: "7 Tage" },
  { days: 30, label: "30 Tage" },
  { days: 90, label: "90 Tage" },
  { days: 0, label: "Alle" },
];

export default function PeriodSwitch({
  value,
  onChange,
}: {
  value: number;
  onChange: (days: number) => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-line text-sm">
      {OPTIONS.map((opt, i) => (
        <button
          key={opt.days}
          onClick={() => onChange(opt.days)}
          className={`px-3 py-1.5 font-medium transition-colors ${
            i < OPTIONS.length - 1 ? "border-r border-line" : ""
          } ${i === 0 ? "rounded-l-md" : ""} ${
            i === OPTIONS.length - 1 ? "rounded-r-md" : ""
          } ${value === opt.days ? "bg-ink text-paper" : "hover:bg-paper-2"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
