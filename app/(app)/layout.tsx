import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import { createClient } from "@/lib/supabase/server";

/**
 * Rahmen für alle Seiten hinter dem Login. Der Redirect für nicht
 * angemeldete Besucher passiert in proxy.ts.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader email={user?.email ?? ""} />
      {children}
      <AppFooter />
    </div>
  );
}
