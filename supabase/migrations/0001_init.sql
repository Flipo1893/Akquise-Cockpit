-- Akquise-Cockpit: Schema, Row Level Security und Realtime
--
-- Einspielen entweder über den SQL-Editor im Supabase-Dashboard
-- oder via `supabase db push` (Supabase CLI).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------------

create table if not exists public.contacts (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,

  typ           text not null check (typ in ('kunde', 'kooperation')),

  firma         text not null check (length(trim(firma)) > 0),
  kontakt       text not null default '',
  rolle         text not null default '',
  email         text not null default '',
  telefon       text not null default '',
  website       text not null default '',
  adresse       text not null default '',
  plz           text not null default '',
  ort           text not null default '',
  kanton        text not null default '',
  branche       text not null default '',
  quelle        text not null default '',

  status        text not null default 'Neu',
  prioritaet    text not null default 'mittel' check (prioritaet in ('hoch', 'mittel', 'tief')),
  tags          text[] not null default '{}',
  notizen       text not null default '',

  -- Append-only Protokolle: werden immer als Ganzes gelesen, nie einzeln gefiltert.
  history        jsonb not null default '[]'::jsonb,
  status_history jsonb not null default '[]'::jsonb,

  -- Eigene Spalten statt JSONB, weil das Dashboard danach filtert und sortiert.
  next_action_beschreibung text,
  next_action_datum        timestamptz,

  -- Nur für typ = 'kooperation' befüllt.
  art             text not null default '',
  wir_bekommen    text not null default '',
  partner_bekommt text not null default '',

  erstellt_am   timestamptz not null default now(),
  geaendert_am  timestamptz not null default now(),

  -- Status muss zum jeweiligen Typ passen.
  constraint contacts_status_passt_zu_typ check (
    (typ = 'kunde' and status in (
      'Neu', 'Recherchiert', 'Kontaktiert', 'Antwort erhalten', 'Termin vereinbart',
      'Angebot draussen', 'Gewonnen', 'Verloren', 'Kein Interesse', 'Später nochmal'
    ))
    or
    (typ = 'kooperation' and status in (
      'Neu', 'Kontaktiert', 'Im Gespräch', 'Vereinbarung in Arbeit',
      'Aktive Kooperation', 'Abgelehnt', 'Auf Eis'
    ))
  )
);

create index if not exists contacts_owner_typ_idx
  on public.contacts (owner_id, typ);

create index if not exists contacts_owner_geaendert_idx
  on public.contacts (owner_id, geaendert_am desc);

create index if not exists contacts_next_action_idx
  on public.contacts (owner_id, next_action_datum)
  where next_action_datum is not null;

-- ---------------------------------------------------------------------------
-- geaendert_am automatisch pflegen
-- ---------------------------------------------------------------------------

create or replace function public.set_geaendert_am()
returns trigger
language plpgsql
as $$
begin
  new.geaendert_am := now();
  return new;
end;
$$;

drop trigger if exists contacts_set_geaendert_am on public.contacts;
create trigger contacts_set_geaendert_am
  before update on public.contacts
  for each row execute function public.set_geaendert_am();

-- ---------------------------------------------------------------------------
-- Row Level Security: jede Person sieht ausschliesslich die eigenen Zeilen
-- ---------------------------------------------------------------------------

alter table public.contacts enable row level security;

drop policy if exists "contacts_select_own" on public.contacts;
create policy "contacts_select_own"
  on public.contacts for select
  using (auth.uid() = owner_id);

drop policy if exists "contacts_insert_own" on public.contacts;
create policy "contacts_insert_own"
  on public.contacts for insert
  with check (auth.uid() = owner_id);

drop policy if exists "contacts_update_own" on public.contacts;
create policy "contacts_update_own"
  on public.contacts for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "contacts_delete_own" on public.contacts;
create policy "contacts_delete_own"
  on public.contacts for delete
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- Realtime: Änderungen an eigenen Zeilen live an offene Clients pushen
-- ---------------------------------------------------------------------------

alter table public.contacts replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'contacts'
  ) then
    alter publication supabase_realtime add table public.contacts;
  end if;
end
$$;
