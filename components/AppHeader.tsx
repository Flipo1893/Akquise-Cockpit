"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/contacts";
import Clock from "./Clock";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/kunden", label: "Kunden" },
  { href: "/kooperationen", label: "Kooperationen" },
  { href: "/import", label: "Import" },
];

/** "sabine.muster@firma.ch" → "SM", als Fallback zwei Zeichen aus dem Namen. */
function initials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase() || "??";
}

export default function AppHeader({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
            <span className="text-[15px] font-semibold tracking-tight">
              Akquise-Cockpit
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "rounded-md border border-line bg-paper-2 px-3 py-1.5 font-medium text-ink"
                      : "rounded-md border border-transparent px-3 py-1.5 text-mute transition-colors hover:bg-paper-2 hover:text-ink"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-mute">
          <Clock />
          <span
            title={email}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper"
          >
            {initials(email)}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-transparent px-2 py-1 text-xs text-mute transition-colors hover:bg-paper-2 hover:text-ink"
            >
              Abmelden
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
