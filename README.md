# Akquise-Cockpit

CRM-Cockpit für Kunden- und Kooperations-Akquise. Next.js 16 (App Router) mit
MongoDB als Datenbank.

## Einrichten

```bash
npm install
cp .env.example .env.local   # MONGODB_URI eintragen
npm run dev                  # http://localhost:3000
```

### Datenbank

Die Verbindung kommt ausschliesslich aus der Umgebung — im Code steht kein
Zugangsdatum. `.env.local` ist per `.gitignore` ausgenommen und landet nicht im
Repository.

| Variable       | Pflicht | Bedeutung                                              |
| -------------- | ------- | ------------------------------------------------------ |
| `MONGODB_URI`  | ja      | Connection String, z. B. von MongoDB Atlas             |
| `MONGODB_DB`   | nein    | Datenbankname, Standard `akquise-cockpit`              |
| `AKQ_STORE`    | nein    | `memory` = ohne Datenbank starten (nur Entwicklung)    |

Beispiel `.env.local`:

```
MONGODB_URI="mongodb+srv://benutzer:passwort@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
```

Beim ersten Start legt die App zwei Collections an (`entities`, `meta`) und
befüllt sie einmalig mit Beispieldaten. Der Marker dafür liegt in `meta` —
wer alle Kontakte löscht, bekommt sie also nicht wieder untergeschoben. Über
*Import → Zurücksetzen* lassen sich die Beispieldaten bewusst neu laden.

Ohne erreichbare Datenbank startet die App trotzdem und zeigt auf jeder Seite
einen Hinweis, statt leere Tabellen vorzutäuschen.

`AKQ_STORE=memory` hält alle Daten im Arbeitsspeicher des Servers. Das ist für
lokale Entwicklung und Tests ohne MongoDB gedacht — die Daten sind beim
Neustart weg und werden zwischen Instanzen nicht geteilt.

## API

Alle Endpunkte liegen unter `/api/entities`. `typ` ist `kunde` oder
`kooperation`.

| Methode  | Pfad                            | Zweck                                  |
| -------- | ------------------------------- | -------------------------------------- |
| `GET`    | `/api/entities?typ=…`           | Kontakte eines Bereichs                |
| `POST`   | `/api/entities`                 | Kontakt anlegen (`typ` im Body)        |
| `PATCH`  | `/api/entities/:id`             | Einzelne Felder ändern                 |
| `DELETE` | `/api/entities/:id`             | Kontakt löschen                        |
| `POST`   | `/api/entities/import?typ=…`    | Mehrere Kontakte anlegen (`rows`)      |
| `POST`   | `/api/entities/reset`           | Alles löschen, Beispieldaten neu laden |

Die API normalisiert Eingaben: unbekannte Felder fallen weg, ungültiger Status
oder ungültige Priorität werden auf Standardwerte gesetzt, und die
Status-Historie sowie `geändertAm` pflegt der Server — nicht der Client.

## Skripte

```bash
npm run dev     # Entwicklungsserver
npm run build   # Produktionsbuild
npm run start   # Produktionsserver
npm run lint    # ESLint
```
