function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} fehlt. .env.local.example nach .env.local kopieren und die Werte ` +
        `aus dem Supabase-Dashboard (Project Settings → API) eintragen.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
