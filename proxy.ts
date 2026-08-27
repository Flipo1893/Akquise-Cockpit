import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth"];

/**
 * Frischt bei jedem Request die Supabase-Session auf und schreibt die
 * erneuerten Tokens zurück in die Response. Ohne das laufen Sessions
 * irgendwann ohne erkennbaren Grund aus.
 *
 * Der Redirect hier ist reiner Komfort. Die eigentliche Absicherung sind die
 * RLS-Policies in Postgres und die Auth-Prüfung in jeder Server Action —
 * Server Actions laufen als POST auf ihrer Route und können einen
 * Proxy-Matcher umgehen.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Verhindert, dass ein CDN eine Response mit Auth-Cookies cached.
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Ist Supabase gerade nicht erreichbar, gilt die Session als nicht
  // bestätigt. Lieber zum Login schicken als jede Route mit einem 500
  // beantworten — die eigentliche Absicherung sind ohnehin die RLS-Policies.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error("Session konnte nicht geprüft werden.", error);
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("weiter", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Alles ausser statischen Assets und Metadaten-Dateien.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
