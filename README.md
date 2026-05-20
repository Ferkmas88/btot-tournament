# BTOT Cuba

Torneo online de Dota 2 para la comunidad cubana. *Jugando como en los viejos tiempos.*

**2 de mayo · 5v5 · Gratis · Premio: Logitech G502 HERO.**

Web construida en Next.js 15 + Tailwind + Supabase + Gemini 3 Pro Image ("Nano Banana 2").

---

## Setup inicial (primera vez)

### 1. Dependencias

```bash
npm install
```

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena:

- `GOOGLE_AI_API_KEY` — la key de Google AI Studio. **La key que pegaste en el chat rotala ya** en console.cloud.google.com → Credentials.
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` — de tu proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — de Supabase → Settings → API. **Server-side only.**
- `NEXT_PUBLIC_DISCORD_INVITE` — link del servidor oficial del torneo.
- `NEXT_PUBLIC_TOURNAMENT_DATE` — fecha/hora ISO con timezone.

### 3. Supabase — crear tablas

En Supabase Dashboard → SQL Editor, pega y ejecuta el contenido de `supabase/schema.sql`.

Eso crea:
- `teams` (registros del torneo)
- `subscribers` (newsletter para próximos eventos)
- `team_stats` (vista pública con totales)

RLS está activado: solo la service role key puede insertar. El endpoint `/api/register` usa esa key desde el server.

### 4. Generar imágenes hero con Nano Banana 2

```bash
npm run generate-images
```

Esto crea 4 PNGs en `public/generated/`:
- `hero-cybercafe.png` — cybercafe cubano 2010 para el hero
- `prize-mouse.png` — render editorial del G502
- `history-havana.png` — escena LAN Habana 2012
- `history-provinces.png` — mapa estilizado de Cuba

Si Gemini falla en algún prompt el script lo reporta y sigue con los demás. Correlo de nuevo para reintentar.

### 5. Dev server

```bash
npm run dev
```

Abre `http://localhost:3000`.

---

## Deploy a Vercel

1. `git init && git add . && git commit -m "initial"` (cuando vos digas).
2. Push a GitHub.
3. Import en Vercel, pegar las env vars de `.env.local`.
4. Deploy. Dominio custom después (btot.gg / bythe oldtime.com).

**Importante**: no commitees `.env.local` ni `public/generated/*.png`. El `.gitignore` ya los excluye.

---

## Funnel de leads — cómo se conecta todo

1. Usuario entra a la landing por share en WhatsApp / Facebook (con UTMs).
2. Ve countdown + premio + historia de Dota Cuba (hook emocional).
3. Se registra: `team_name`, `captain_name`, `captain_steam`, **`captain_contact` + `contact_type` obligatorio**, provincia, 4 nicks.
4. El form hace POST a `/api/register` → Supabase `teams` table.
5. En success, redirect visual al Discord (botón prominente).
6. Vos exportás el CSV de `teams` desde Supabase antes y después del torneo.
7. Post-torneo: broadcast por WhatsApp Business o Telegram al 100% de los capitanes.

### Exportar leads para remarketing

En Supabase → Table editor → `teams` → Export → CSV.

Campos clave para importar a tu CRM:
- `captain_contact` + `contact_type` (el número + canal)
- `province` (para segmentar por región)
- `created_at` (para ver orden de llegada)
- `utm_source` (qué canal funcionó)

---

## Estructura

```
app/
  layout.tsx              ← fonts, metadata, capas globales (grain/scanlines/vignette)
  page.tsx                ← landing: Hero → Prize → Format → History → Register → Footer
  globals.css             ← variables CSS, botones, inputs, efectos nostálgicos
  api/
    register/route.ts     ← POST: valida con Zod, inserta en Supabase
    generate-image/route.ts ← POST: genera imagen on-demand con Nano Banana 2
components/
  Hero.tsx                ← título + countdown + CTA
  Countdown.tsx           ← client, tick cada 1s
  Prize.tsx               ← detalles del G502
  Format.tsx              ← 6 tarjetas (5v5, online, etc.)
  History.tsx             ← timeline Dota 2 Cuba (placeholder, poblar después)
  Register.tsx + RegisterForm.tsx  ← form client-side
  Footer.tsx              ← links, Discord, créditos Digital AM
lib/
  supabase.ts             ← cliente service + public, lista de PROVINCES
  gemini.ts               ← helper Nano Banana 2 compartido
scripts/
  generate-hero-images.mjs ← corre una vez para generar assets visuales
supabase/
  schema.sql              ← migración inicial
public/
  placeholder-mouse.jpeg  ← foto real del G502 (fallback si no se generó prize-mouse.png)
  generated/              ← output de Nano Banana 2 (gitignored)
```

---

## Setup Lemon Squeezy (ticket único)

Validamos el modelo "paga-por-torneo" con Lemon Squeezy en vez de Stripe porque
LS es merchant-of-record (maneja tax/VAT/legal sin que necesitemos LLC en US).
Las fees son ~5% + $0.50 vs Stripe 2.9% + $0.30 — diferencia trivial mientras
estamos validando. La migración a Stripe es swap detrás de `lib/payments/provider.ts`
cuando Fernando tenga LLC en US.

Pasos (Fernando hace esto la primera vez):

1. Crear cuenta en https://www.lemonsqueezy.com (modo test primero).
2. Crear una **Store** desde el dashboard. Copiar el **Store ID** (URL: `/stores/123` → ID `123`).
3. En la store crear un **Product** tipo "One-time payment" llamado `Inscripción Torneo Papaque`.
   - Crear un **Variant** con precio placeholder (USD 1) — el precio real se pisa en cada checkout via `custom_price`.
   - Copiar el **Variant ID**.
4. Settings → API → generar **API Key** con permisos de store.
5. Settings → Webhooks → New webhook:
   - URL: `https://papaque.online/api/lemonsqueezy/webhook`
   - Events: `order_created`, `order_refunded`
   - Copiar el **Signing Secret**.
6. Pegar en `.env.local` (y en Vercel env):
   ```
   LEMONSQUEEZY_API_KEY=lemonsqueezy_xxx
   LEMONSQUEEZY_STORE_ID=12345
   LEMONSQUEEZY_VARIANT_ID_TOURNAMENT_ENTRY=67890
   LEMONSQUEEZY_WEBHOOK_SECRET=whsec_xxx
   NEXT_PUBLIC_SITE_URL=https://papaque.online
   ```
7. Crear un torneo nuevo en Supabase con `entry_fee_usd > 0` y `status='open'`:
   ```sql
   insert into tournaments
     (slug, name, format, max_teams, entry_fee_usd, status, starts_at)
   values
     ('papaque-2', 'Papaque #2', 'round_robin', 8, 5.00, 'open', '2026-06-15 18:00-04');
   ```
8. Probar inscripción end-to-end en modo test de LS antes de pasar a producción.

Mientras `entry_fee_usd = 0` (como Papaque #1), el flow de inscripción NO llama
a LS — los equipos se registran como `payment_status='free'` y el sitio funciona
sin esta config.

## Setup Resend (confirmaciones email)

El webhook de LS dispara un email de confirmación al capitán via Resend.

1. Crear cuenta en https://resend.com.
2. Verificar dominio `papaque.online` (DNS records que LS lista).
3. Settings → API Keys → create.
4. Pegar en `.env.local` y Vercel:
   ```
   RESEND_API_KEY=re_xxx
   RESEND_FROM_EMAIL=noreply@papaque.online
   ```

Si `RESEND_API_KEY` no está seteada, el webhook sigue confirmando el pago en
DB pero loguea el error de envío. El capitán siempre puede ver su equipo en
`/equipo/{join_code}`.

---

## Siguiente sesión (pending)

- Poblar `components/History.tsx` con nombres reales de torneos, YouTubers cubanos, fechas verificadas. **Requiere research web dedicado — no inventar.**
- Agregar página `/reglas` con reglamento del torneo.
- Bracket embed (Challonge o Battlefy) cuando tengas los 16 equipos.
- Meta Pixel + Google Analytics 4 para tracking de conversión.
- Página `/hall-of-fame` con campeones de torneos anteriores.
