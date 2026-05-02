import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return supabaseResponse;

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refresh session si expira pronto. Errores no rompen la pagina.
    await supabase.auth.getUser();
  } catch {
    // Cualquier fallo: dejar pasar la request sin refresh.
  }

  return supabaseResponse;
}

export const config = {
  // Solo correr en rutas que necesitan refresh de sesion (auth + perfil + chat).
  // Esto evita que un fallo de middleware tumbe la home, /admin, /equipo, etc.
  matcher: ['/auth/:path*', '/perfil/:path*', '/chat/:path*'],
};
