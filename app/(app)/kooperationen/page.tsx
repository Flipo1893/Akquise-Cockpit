import KooperationenView from "./KooperationenView";
import { getContacts } from "@/lib/queries";

export const metadata = { title: "Kooperationen · Akquise-Cockpit" };

export default async function KooperationenPage() {
  const initial = await getContacts("kooperation");
  return <KooperationenView initial={initial} />;
}
