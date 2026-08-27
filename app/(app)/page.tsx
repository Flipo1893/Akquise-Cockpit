import DashboardView from "@/components/dashboard/DashboardView";
import { getAllContacts } from "@/lib/queries";

export default async function DashboardPage() {
  const { kunden, koop } = await getAllContacts();
  return <DashboardView initialKunden={kunden} initialKoop={koop} />;
}
