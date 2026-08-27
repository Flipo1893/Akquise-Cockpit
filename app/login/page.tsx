import LoginForm from "./LoginForm";

export const metadata = { title: "Anmelden · Akquise-Cockpit" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const weiter = typeof params.weiter === "string" ? params.weiter : "/";

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
          <span className="text-[15px] font-semibold tracking-tight">
            Akquise-Cockpit
          </span>
        </div>
        <LoginForm weiter={weiter} />
      </div>
    </div>
  );
}
