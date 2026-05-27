import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

// Refresca la sesión del usuario en cada request.
// Llamado desde middleware.ts en la raíz del proyecto.
// Sin esto, las sesiones expirarían sin que el cliente lo sepa.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca la sesión. No usar getUser() en condicionales antes de esta llamada.
  const { data: { user } } = await supabase.auth.getUser();

  // ── Protección de rutas ─────────────────────────────────────────────────────
  // Si el usuario no está autenticado e intenta acceder a rutas protegidas,
  // lo redirigimos al login. Ajustá los paths según la estructura de tu app.
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
                      request.nextUrl.pathname.startsWith("/register");
  const isPublicRoute = request.nextUrl.pathname === "/";

  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
