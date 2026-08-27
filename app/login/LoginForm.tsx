"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { buttonPrimaryClass, cardClass, inputClass } from "@/lib/ui";

const EMPTY: AuthState = {};

export default function LoginForm({ weiter }: { weiter: string }) {
  const [modus, setModus] = useState<"login" | "registrieren">("login");
  const action = modus === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, EMPTY);

  return (
    <div className={`${cardClass} p-6`}>
      <h1 className="text-lg font-semibold tracking-tight">
        {modus === "login" ? "Anmelden" : "Konto erstellen"}
      </h1>
      <p className="mt-1 mb-5 text-sm text-mute">
        {modus === "login"
          ? "Deine Kontakte sind an dein Konto gebunden."
          : "Mindestens 8 Zeichen für das Passwort."}
      </p>

      <form action={formAction} className="space-y-3 text-sm">
        <input type="hidden" name="weiter" value={weiter} />
        <label className="block">
          E-Mail
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="block">
          Passwort
          <input
            type="password"
            name="password"
            required
            autoComplete={modus === "login" ? "current-password" : "new-password"}
            className={`mt-1 ${inputClass}`}
          />
        </label>

        {state.error && (
          <p className="rounded-md border border-line bg-accent-soft px-3 py-2 text-xs text-accent-2">
            {state.error}
          </p>
        )}
        {state.info && (
          <p className="rounded-md border border-line bg-paper-2 px-3 py-2 text-xs text-mute">
            {state.info}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={`w-full ${buttonPrimaryClass} disabled:opacity-60`}
        >
          {pending
            ? "Einen Moment…"
            : modus === "login"
              ? "Anmelden"
              : "Konto erstellen"}
        </button>
      </form>

      <button
        onClick={() => setModus(modus === "login" ? "registrieren" : "login")}
        className="mt-4 text-xs text-mute transition-colors hover:text-ink"
      >
        {modus === "login"
          ? "Noch kein Konto? Jetzt erstellen"
          : "Schon registriert? Zur Anmeldung"}
      </button>
    </div>
  );
}
