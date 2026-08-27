"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  info?: string;
}

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
    weiter: String(formData.get("weiter") || "/"),
  };
}

/** Nur app-interne Pfade zulassen, sonst ist das eine offene Weiterleitung. */
function safeRedirect(target: string): string {
  return target.startsWith("/") && !target.startsWith("//") ? target : "/";
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password, weiter } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-Mail oder Passwort stimmt nicht." };
  }

  redirect(safeRedirect(weiter));
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password, weiter } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben." };
  }
  if (password.length < 8) {
    return { error: "Das Passwort braucht mindestens 8 Zeichen." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Ist die E-Mail-Bestätigung im Supabase-Projekt aktiv, gibt es noch
  // keine Session — dann muss zuerst der Link in der Mail geklickt werden.
  if (!data.session) {
    return {
      info: "Fast geschafft: Bestätige die Registrierung über den Link in deiner E-Mail.",
    };
  }

  redirect(safeRedirect(weiter));
}
