import { daysAgo, daysFromNow } from "./format";
import { KEY_SEEDED, saveKunden, saveKoop } from "./storage";
import type { Entity, HistoryEntry, Priority } from "./types";

function mk(
  firma: string,
  kontakt: string,
  rolle: string,
  email: string,
  telefon: string,
  website: string,
  adresse: string,
  plz: string,
  ort: string,
  kanton: string,
  branche: string,
  quelle: string,
  status: string,
  prio: Priority,
  tags: string[],
  notizen: string,
  erstelltVorTagen: number,
  geaendertVorTagen: number,
): Entity {
  const erstelltAm = daysAgo(erstelltVorTagen);
  const geaendertAm = daysAgo(geaendertVorTagen);
  const nextIn = Math.floor(Math.random() * 10) - 4;
  const history: HistoryEntry[] = [
    {
      datum: geaendertAm,
      kanal: "E-Mail",
      richtung: "raus",
      betreff: "Erstkontakt",
      inhalt: "Kurze Vorstellung geschickt.",
      ergebnis: "Offen",
      nachrichtenId: null,
      versandstatus: "gesendet",
      antwortstatus: "offen",
    },
  ];
  return {
    id: crypto.randomUUID(),
    typ: "kunde",
    firma,
    kontakt,
    rolle,
    email,
    telefon,
    website,
    adresse,
    plz,
    ort,
    kanton,
    branche,
    quelle,
    status,
    priorität: prio,
    tags,
    notizen,
    erstelltAm,
    geändertAm: geaendertAm,
    history,
    nextAction: { beschreibung: "Follow-up", datum: daysFromNow(nextIn) },
    statusHistory: [{ status, datum: geaendertAm }],
  };
}

function mkK(
  firma: string,
  kontakt: string,
  rolle: string,
  email: string,
  telefon: string,
  website: string,
  adresse: string,
  plz: string,
  ort: string,
  kanton: string,
  branche: string,
  quelle: string,
  status: string,
  prio: Priority,
  tags: string[],
  notizen: string,
  erstelltVorTagen: number,
  geaendertVorTagen: number,
  art: string,
  wirBekommen: string,
  partnerBekommt: string,
): Entity {
  const c = mk(
    firma, kontakt, rolle, email, telefon, website, adresse, plz, ort, kanton,
    branche, quelle, status, prio, tags, notizen, erstelltVorTagen, geaendertVorTagen,
  );
  c.typ = "kooperation";
  c.art = art;
  c.wirBekommen = wirBekommen;
  c.partnerBekommt = partnerBekommt;
  return c;
}

export function seedIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEY_SEEDED)) return;

  const kunden: Entity[] = [
    mk("Bergmann Logistik AG", "Nadja Bergmann", "Geschäftsführung", "nadja@bergmann-log.ch", "044 555 12 30", "bergmann-log.ch", "Industriestrasse 4", "8005", "Zürich", "ZH", "Logistik", "LinkedIn", "Termin vereinbart", "hoch", ["Zielkunde", "Warm"], "Sehr interessiert, Termin am 14.06.", 22, 2),
    mk("Solari Bau GmbH", "Marco Solari", "Einkauf", "m.solari@solaribau.ch", "091 220 44 10", "solaribau.ch", "Via Nassa 12", "6900", "Lugano", "TI", "Bau", "Empfehlung", "Kontaktiert", "mittel", ["Neukunde"], "Erste Mail geschickt.", 15, 15),
    mk("Frei Consulting", "Peter Frei", "Partner", "peter@freiconsulting.ch", "", "freiconsulting.ch", "", "3011", "Bern", "BE", "Beratung", "Messe", "Angebot draussen", "hoch", ["Zielkunde"], "Angebot über CHF 12'000 verschickt.", 30, 3),
    mk("Kunz Elektro AG", "Sonja Kunz", "Leitung Einkauf", "sonja.kunz@kunzelektro.ch", "062 888 00 00", "kunzelektro.ch", "", "5000", "Aarau", "AG", "Elektro", "Kaltakquise", "Neu", "tief", [], "", 4, 4),
    mk("Vetterli Immobilien", "Urs Vetterli", "Inhaber", "urs@vetterli-immo.ch", "044 222 33 44", "vetterli-immo.ch", "", "8400", "Winterthur", "ZH", "Immobilien", "Website", "Antwort erhalten", "mittel", ["Warm"], "Fragt nach Referenzen.", 9, 1),
    mk("Object 8 Design", "Lena Ott", "Creative Director", "lena@object8.ch", "", "object8.ch", "", "4000", "Basel", "BS", "Design", "LinkedIn", "Verloren", "tief", [], "Hat Budget gestrichen.", 40, 20),
    mk("Rhone Energie SA", "Claire Dubois", "Directrice", "c.dubois@rhone-energie.ch", "027 111 22 33", "rhone-energie.ch", "", "1950", "Sion", "VS", "Energie", "Empfehlung", "Gewonnen", "hoch", ["Referenzkunde"], "Vertrag unterschrieben.", 60, 10),
    mk("Nova Print AG", "Hans Meier", "Verkauf", "h.meier@novaprint.ch", "", "novaprint.ch", "", "9000", "St. Gallen", "SG", "Druck", "Kaltakquise", "Später nochmal", "tief", [], "Meldet sich im Herbst wieder.", 50, 50),
  ];

  const koop: Entity[] = [
    mkK("Studio Klar", "Fabienne Roth", "Inhaberin", "fabienne@studioklar.ch", "", "studioklar.ch", "", "8004", "Zürich", "ZH", "Grafikdesign", "LinkedIn", "Im Gespräch", "hoch", ["Cross-Sell"], "Gemeinsames Angebot für Rebranding-Pakete.", 18, 2, "Empfehlungspartner", "Zugang zu Design-Kunden", "Zugang zu unseren Tech-Kunden"),
    mkK("WerkStadt Coworking", "Tobias Egli", "Community Lead", "tobias@werkstadt.ch", "", "werkstadt.ch", "", "3007", "Bern", "BE", "Coworking", "Event", "Aktive Kooperation", "hoch", ["Laufend"], "Monatlicher Workshop, läuft gut.", 70, 5, "Event-Partnerschaft", "Sichtbarkeit bei Gründern", "Content für ihre Community"),
    mkK("Nordwind Marketing", "Anja Berger", "Partnerin", "anja@nordwind.ch", "", "nordwind.ch", "", "4051", "Basel", "BS", "Marketing", "Kaltakquise", "Kontaktiert", "mittel", [], "Erstkontakt per Mail.", 6, 6, "Reseller", "Provisionsmodell", "Zusatzangebot für Kunden"),
    mkK("Helix Ventures", "David Suter", "Associate", "d.suter@helix.vc", "", "helix.vc", "", "8001", "Zürich", "ZH", "Investoren", "Empfehlung", "Auf Eis", "tief", [], "Timing passt aktuell nicht.", 90, 80, "Netzwerk", "Sichtbarkeit im Portfolio", "Kein direkter Nutzen definiert"),
    mkK("Grünstadt Verein", "Miriam Huber", "Präsidentin", "miriam@gruenstadt.ch", "", "gruenstadt.ch", "", "6003", "Luzern", "LU", "Verein", "Website", "Vereinbarung in Arbeit", "mittel", ["Non-Profit"], "Sponsoring-Vertrag in Prüfung.", 12, 1, "Sponsoring", "Imagegewinn, lokale Präsenz", "Finanzierung eines Events"),
  ];

  saveKunden(kunden);
  saveKoop(koop);
  localStorage.setItem(KEY_SEEDED, "1");
}
