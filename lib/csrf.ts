// CSRF mitigation: verificar que Origin/Referer del POST coincide con nuestro host.
// Cubre el caso donde un sitio malicioso intenta hacer fetch con la cookie del user.
// SameSite=Lax (default Supabase) ya bloquea cross-site POST en navegadores modernos,
// esto es defense in depth.

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) {
    // Sin Origin (algunos clients no lo mandan); fallback a Referer.
    const referer = request.headers.get('referer');
    if (!referer || !host) return false;
    try {
      const refUrl = new URL(referer);
      return refUrl.host === host;
    } catch {
      return false;
    }
  }
  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
