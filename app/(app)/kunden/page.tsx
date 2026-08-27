import KundenView from "./KundenView";
import { getContacts } from "@/lib/queries";

export const metadata = { title: "Kunden · Akquise-Cockpit" };

export default async function KundenPage() {
  const initial = await getContacts("kunde");
  return <KundenView initial={initial} />;
}
