# Akquise-Cockpit

CRM-Cockpit für Kunden- und Kooperations-Akquise. Next.js 16 (App Router,
TypeScript, Tailwind v4) mit Supabase als Datenbank, Auth und Realtime-Backend.

## Einrichtung

### 1. Supabase-Projekt anlegen

Auf [supabase.com](https://supabase.com) ein Projekt erstellen. Region möglichst
nah wählen (z.B. `eu-central-1`), das spart bei jedem Request Latenz.

### 2. Schema einspielen

Im Supabase-Dashboard unter **SQL Editor** den Inhalt von
`supabase/migrations/0001_init.sql` ausführen. Das legt an:

- Tabelle `contacts` (Kunden und Kooperationen, unterschieden über `typ`)
- **Row Level Security** — jede Person sieht ausschliesslich die eigenen Zeilen
- Trigger, der `geaendert_am` bei jedem Update selbst pflegt
- Realtime-Publikation, damit Änderungen live an offene Clients gehen

### 3. Zugangsdaten eintragen

```bash
cp .env.local.example .env.local
```

Die beiden Werte stehen im Dashboard unter **Project Settings → API**:

| Variable | Wo |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project API keys → `anon` / `public` |

Der `anon`-Key darf öffentlich sein — er gewährt für sich genommen keinerlei
Zugriff, die Absicherung machen die RLS-Policies. Den `service_role`-Key
niemals ins Frontend oder ins Repository legen.

### 4. Anmeldung konfigurieren

Unter **Authentication → Providers** ist `Email` standardmässig aktiv. Für den
Start ohne eigenen Mailversand unter **Authentication → Sign In / Providers**
die Option *Confirm email* deaktivieren — dann ist man direkt nach der
Registrierung angemeldet. Für den Produktivbetrieb sollte die Bestätigung an
sein, dazu unter **Project Settings → Auth → SMTP** einen eigenen Mailversand
hinterlegen.

### 5. Starten

```bash
npm install
npm run dev
```

Beim ersten Aufruf auf `/login` ein Konto erstellen.

## Daten aus dem alten Prototyp übernehmen

Die erste Fassung hielt alles im `localStorage` des Browsers. Wurden dort
Kontakte erfasst, lassen sie sich auf der Seite **Import** über
*Lokale Daten übernehmen* einmalig ins Konto holen. Nach erfolgreicher
Übernahme wird die lokale Kopie entfernt.

## Aufbau

```
app/
  (app)/            Alles hinter dem Login; layout.tsx liefert Header/Footer
    page.tsx        Dashboard
    kunden/         Kundenliste
    kooperationen/  Kooperationsliste
    import/         CSV-Import
  actions/          Server Actions (Schreibzugriffe, Auth)
  login/            Anmeldung und Registrierung
components/
  contacts/         Gemeinsame Tabellenansicht für beide Kontaktarten
  dashboard/        KPI-Kacheln, Statusverteilung, Fälligkeitslisten
lib/
  supabase/         Clients für Browser und Server, DB-Typen
  queries.ts        Serverseitige Lesezugriffe
  mappers.ts        Umwandlung DB-Zeile ↔ UI-Modell
  useContacts.ts    Client-Hook inkl. Realtime-Abo
proxy.ts            Session-Refresh und Redirect für Nicht-Angemeldete
supabase/migrations Schema als SQL
```

### Wie die Daten fliessen

Der erste Datenstand wird **serverseitig** geladen (`lib/queries.ts`) und an die
Client-Komponenten übergeben — dadurch steht die Tabelle sofort, ohne leeren
Zwischenzustand. Danach hält ein **Realtime-Abo** (`lib/useContacts.ts`) die
Liste über Geräte und Browser-Tabs hinweg synchron.

Schreibzugriffe laufen ausschliesslich über **Server Actions**
(`app/actions/contacts.ts`). Deren Rückgabewert wird zusätzlich direkt in den
lokalen Zustand gespielt, damit die eigene Änderung auch dann sichtbar wird,
wenn die Realtime-Verbindung gerade hängt. Weil über die `id` gemergt wird, ist
doppeltes Einspielen unproblematisch.

### Absicherung

Drei Ebenen, bewusst voneinander unabhängig:

1. **RLS-Policies in Postgres** — die eigentliche Grenze. Selbst mit dem
   `anon`-Key kommt niemand an fremde Zeilen.
2. **Auth-Prüfung in jeder Server Action** — Server Actions laufen als POST auf
   ihrer jeweiligen Route und können einen Proxy-Matcher umgehen, deshalb prüft
   jede Action die Session selbst.
3. **`proxy.ts`** — frischt die Session auf und leitet Nicht-Angemeldete zum
   Login. Reiner Komfort, keine Sicherheitsgrenze.

## Befehle

```bash
npm run dev     # Entwicklungsserver
npm run build   # Produktions-Build
npm run lint    # ESLint
npx tsc --noEmit  # Typprüfung
```

## Deployment

Die App braucht einen Node-Server (wegen `proxy.ts` kein statischer Export).
Auf der Zielplattform dieselben zwei Umgebungsvariablen setzen wie in
`.env.local`.
