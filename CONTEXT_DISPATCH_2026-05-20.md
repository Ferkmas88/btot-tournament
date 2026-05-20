# Context Handoff — Sesión Dispatch 2026-05-20

> Documento de handoff escrito al final de una sesión de Cowork/Dispatch para que Fernando (o el próximo Claude Code) pueda retomar el trabajo desde VSCode sin perder contexto.

## Identidad del proyecto

- **Marca real:** P'APA QUE!? (Papaque, NO "Papá Cuba")
- **Organizador (BTOT brand):** By The Olds Time / Pedritín
- **Dominio:** papaque.online
- **Juego:** Dota 2
- **Stack:** Next.js 15, React 19, TypeScript, Tailwind v4, Supabase (con RLS), Steam OpenID, OpenDota, Resend, Vercel
- **WhatsApp del organizador:** +1 832 291 7750
- **Repo:** Ferkmas88/btot-tournament (GitHub)
- **Branch principal:** main (Fase 1 + Fase 2 ya mergeadas vía PR #1 squash)
- **Supabase project ref:** `eoyikeullkyypixisvkq`
- **Vercel deploy actual:** `btot-tournament-bpyo83bop-fernandos-projects-f79a242a.vercel.app` (alias → papaque.online)

## Decisiones de negocio tomadas en esta sesión

- **Modelo de cobro:** ticket único (NO membresía), validar antes de armar suscripciones.
- **Precio Papaque #1:** $15 USD por jugador, $75 por equipo (5 titulares mínimo).
- **Prize pool:** $1,000 ($600 / $200 / $200). NOTA: margen real ~$100 si llenan los 16 equipos ($1,200 ingresos brutos - $1,000 prize - fees).
- **Pagos:** Lemon Squeezy como provider digital (no Stripe, no requiere LLC US). **Pendiente aprobación de Peter** para abrir cuenta. Código integrado pero env vars no seteadas. Offline payment (WhatsApp + WU + Remitly) funciona end-to-end como fallback.
- **Servers permitidos:** US-East, US-West, Peru, Brazil.
- **Eligibility Papaque #1:** mmr_max_per_team=30000, rank_min=divine_1, required_immortal_per_team=2.
- **Formato:** groups_playoffs (16 equipos: viernes grupos A-B, sábado grupos C-D + quarterfinals, domingo semifinals + lower final + grand final).

## Lo que se construyó (resumen alto nivel)

### Fase 1 (commits previos en branch `feat/ticket-unico-lemonsqueezy`, ya en main)
- `005d7f9` Countdown vencido reemplazado por hero TBA variant.
- `b2706a3` Tabla `tournaments` + RLS + queries tournament-scoped en todo el código (lib/tournaments.ts es el helper).
- `5d80cbe` Integración Lemon Squeezy (`/api/lemonsqueezy/webhook` + `lib/payments/provider.ts` con strategy pattern).
- `3595ef4` Tabla `organizers` + campos completos del flyer Papaque + offline payment como opción adicional en payment_methods.

### Fase 2 (commit `bb4418c`)
- Auth de organizadores (signup, login, logout con email+password) en `/auth/*` y `/organizer/{signup,login}`.
- Dashboard `/dashboard` con stats y listado de torneos del organizer (RLS-filtered automático).
- Wizard 7 pasos en `/dashboard/torneos/nuevo` (básicos → formato → elegibilidad → pricing → prize pool → schedule → reglas+review). Guarda en localStorage entre pasos.
- Página pública del torneo `/torneos/[slug]` (estilo flyer con todos los campos del schema).
- Página política de inscripción `/torneos/[slug]/politica` (auto-generada desde refund_policy_days + payment_methods).
- Inscripción tournament-aware `/torneos/[slug]/inscribirse` (auth-gated, redirige a /auth/login con next param).
- Listado público `/torneos` (lista status open/live/closed).
- Admin endpoints en `/api/dashboard/tournaments/[slug]/status` (toggle) y `/api/dashboard/teams/[id]/mark-paid` (offline payment manual).
- Endpoint `/api/dashboard/tournaments/create` para wizard submit.
- Endpoint `/api/organizer/upsert` para onboarding profile.

### Hotfixes aplicados en esta sesión (commits `f30939a` + `e97f311`)
- `f30939a` **fix(v4): drop active_tournament view before column rename.** La view `active_tournament` (v3) era `select * from tournaments`, capturó el column set al momento de crearse. El `drop column entry_fee_usd` en v4 reventaba con 2BP01 porque la view dependía de esa columna. Agregado `drop view if exists public.active_tournament cascade;` antes del column drop y recreación de la view al final del archivo. Sin este fix, `supabase db push` o fresh installs revientan.
- `e97f311` **fix(v4): expand tournaments_format_check.** v3 hardcodeaba `check (format in ('single_elim','double_elim','round_robin'))`. El update de Papaque #1 a `format='groups_playoffs'` reventaba con 23514. Drop + recreate del check con `('single_elim','double_elim','round_robin','groups_playoffs','swiss','gsl')` permite el formato del flyer y deja espacio para swiss y gsl.

## Schema actual de DB (verificado live)

### `public.tournaments` (31 columnas)
```
id                          uuid           NOT NULL  default gen_random_uuid()
slug                        text           NOT NULL  (unique)
name                        text           NOT NULL
game                        text           NOT NULL  default 'dota2'
format                      text           NOT NULL  default 'double_elim'
                            check (format in ('single_elim','double_elim','round_robin','groups_playoffs','swiss','gsl'))
max_teams                   integer        NOT NULL  default 16
team_size                   integer        NOT NULL  default 5
prize_pool_pct              numeric        NOT NULL  default 0.50  (legacy, mantenido por compat)
status                      text           NOT NULL  default 'draft'
                            check (status in ('draft','open','live','closed','cancelled'))
starts_at                   timestamptz    NULL
registration_closes_at      timestamptz    NULL
created_at                  timestamptz    NOT NULL  default now()
organizer_id                uuid           NOT NULL  FK → organizers(id) ON DELETE RESTRICT
description                 text           NULL
coach_required              boolean        NOT NULL  default false
substitutes_allowed         integer        NOT NULL  default 0
mmr_min                     integer        NULL
mmr_max_per_team            integer        NULL
rank_min                    text           NULL
required_immortal_per_team  integer        NOT NULL  default 0
entry_fee_per_player_usd    numeric(10,2)  NOT NULL  default 0
entry_fee_per_team_usd      numeric(10,2)  NOT NULL  default 0
prize_pool_usd              numeric(10,2)  NOT NULL  default 0
prize_distribution          jsonb          NULL      (ej: {"1st":600,"2nd":200,"3rd":200})
schedule_notes              text           NULL
servers_allowed             text[]         NULL
anti_cheat_rules            text           NULL
refund_policy_days          integer        NOT NULL  default 1
payment_methods             text[]         NOT NULL  default ARRAY['card']  (card | whatsapp_alt | wu | remitly | offline)
updated_at                  timestamptz    NOT NULL  default now()  (auto-touched por trigger)
```

### `public.organizers` (11 columnas)
```
id                uuid         NOT NULL  default gen_random_uuid()
user_id           uuid         NULL      FK → auth.users(id) ON DELETE SET NULL
display_name      text         NOT NULL
contact_whatsapp  text         NULL
contact_telegram  text         NULL
contact_discord   text         NULL
contact_email     text         NULL
bio               text         NULL
avatar_url        text         NULL
created_at        timestamptz  NOT NULL  default now()
updated_at        timestamptz  NOT NULL  default now()
```

### `public.teams` (37 columnas, tournament_id agregado en v3, payment fields en v3+v4)
```
id                  uuid         NOT NULL  default gen_random_uuid()
created_at          timestamptz  NOT NULL  default now()
team_name           text         NOT NULL
captain_name        text         NOT NULL
captain_steam       text         NULL
captain_contact     text         NOT NULL
contact_type        text         NOT NULL
province            text         NOT NULL
player_2..player_5  text         NULL  (legacy steam IDs)
player_2_name..5_name + _email   text NULL  (modernos)
captain_email       text         NULL
captain_user_id     uuid         NULL      (auth.users link, no FK formal)
tournament_id       uuid         NULL      FK → tournaments(id)  ⚠ debería ser NOT NULL en v6
notes               text         NULL
referral_source     text         NULL
utm_source/medium/campaign       text NULL
join_code           text         NULL
status              text         NOT NULL  default 'pending'
payment_status      text         NOT NULL  default 'pending'  (pending | paid | refunded | failed)
payment_provider    text         NULL      (lemonsqueezy | offline | manual)
payment_ref         text         NULL      (order ID externo)
payment_amount_usd  numeric      NULL
paid_at             timestamptz  NULL
coach_name          text         NULL
coach_email         text         NULL
payment_method      text         NULL      (card | offline)
```

### Foreign Keys
- `teams.tournament_id` → `tournaments.id`
- `tournaments.organizer_id` → `organizers.id` (ON DELETE RESTRICT)

### Views
- `public.active_tournament` — `select * from tournaments where status in ('open','live') order by starts_at desc nulls last, created_at desc limit 1`
- `public.featured_tournament` — fallback: primer `(open|live)` desc por starts_at; si nada, último `closed` desc. UNION ALL + LIMIT 1.

### RLS Policies activas
**tournaments:**
- `tournaments_public_read` (SELECT, public): `status in ('open','live','closed')`
- `tournaments_organizer_read_own` (SELECT, authenticated): `organizer_id in (select id from organizers where user_id=auth.uid())`
- `tournaments_organizer_write_own` (INSERT, authenticated): same predicate as WITH CHECK
- `tournaments_organizer_update_own` (UPDATE, authenticated): same
- `tournaments_organizer_delete_own` (DELETE, authenticated): same

**organizers:**
- `organizers_public_read` (SELECT, public): `true`
- `organizers_self_write` (ALL, authenticated): `user_id = auth.uid()` (USING + WITH CHECK)

**teams:**
- `anon_read_teams` (SELECT, public): `true`  ⚠ public puede leer TODOS los teams (no scoped)
- `teams_organizer_read_own` (SELECT, authenticated): `tournament_id in (select t.id from tournaments t join organizers o on o.id=t.organizer_id where o.user_id=auth.uid())`
- `teams_organizer_update_own` (UPDATE, authenticated): same

## Estado de las migraciones

- `v2_security_hardening.sql` ✓ aplicada (sesión previa)
- `v2_steam_chat.sql` ✓ aplicada (sesión previa)
- `v3_tournaments.sql` ✓ aplicada (esta sesión)
- `v4_organizers_and_full_tournament_fields.sql` ✓ aplicada (con 2 hotfixes en archivo + en prod)
- `v5_organizer_auth_and_rls.sql` ✓ aplicada
- Papaque #1 con `status='open'` en producción
- Pedritín seedeado como primer organizer (id `f6203ffa-b8cd-48f9-a0a2-a07f9065a166`)

## Verificación SQL post-deploy

```
papaque-1: status=open · format=groups_playoffs · entry_fee_per_team_usd=75.00
           entry_fee_per_player_usd=15.00 · prize_pool_usd=1000.00 · has_organizer
Pedritín:  id=f6203ffa-... · whatsapp=+1 832 291 7750
teams:     5 (preservadas — todas con tournament_id=papaque-1.id post-backfill v3)
featured_tournament: papaque-1 / open / P'APA QUE!? — Torneo Dota 2
active_tournament:   papaque-1 / open
```

## Configuración aplicada en esta sesión

### Supabase (vía Management API con SUPABASE_ACCESS_TOKEN)
- **Auth Redirect URLs** (union de original Fernando + nuevos):
  - `https://papaque.online`
  - `https://papaque.online/**`
  - `https://papaque.online/*`
  - `https://papaque.online/auth/callback`
  - `https://papaque.online/organizer/onboarding`
  - `https://www.papaque.online`
  - `https://www.papaque.online/**`
- `site_url = https://papaque.online`
- `mailer_autoconfirm = false` (signup manda confirmation email — decisión pendiente)
- `disable_signup = false`

### GitHub / Vercel
- PR #1 squash-mergeado a main → squash commit `cf3ee59`
- Vercel auto-deployó (target=production), status READY en ~22s
- Build pasó local sin errores antes del merge

## Rutas verificadas en producción (papaque.online)

| Ruta | Status | Notas |
|------|--------|-------|
| `/` | 200 | ⚠ Aún muestra hero TBA hardcoded, NO lee de featured_tournament |
| `/torneos` | 200 | Lista Papaque #1, $1000 prize, 16 equipos, badge abierto, grupos+playoffs |
| `/torneos/papaque-1` | 200 | Flyer completo: $75/team, $15/player, Pedritín, full schema |
| `/torneos/papaque-1/inscribirse` | 307 → `/auth/login?next=...` | Auth-gated correcto |
| `/torneos/papaque-1/politica` | 200 | Refund policy + payment methods auto-generados |
| `/inscribirse` | 307 → `/torneos/papaque-1/inscribirse` | Redirect convenience funcionando |
| `/organizer/signup` | 200 | Carga, auth flow ahora habilitado (post-redirect-URL fix) |
| `/organizer/login` | 200 | OK |
| `/organizer/onboarding` | server-rendered, requiere auth | URL whitelist OK |
| `/dashboard` | requiere auth | RLS filtra por organizer |
| `/dashboard/torneos/nuevo` | requiere auth | Wizard 7 pasos |
| `/dashboard/torneos/[slug]` | requiere auth | Admin panel |
| `/auth/login` `/auth/signup` `/auth/callback` `/auth/logout` | 200 / OK | Funcionan |
| `/chat` `/perfil` `/equipo/[code]` `/unirse/[code]` | server-rendered | Preservados de Fase 0/1 |
| `/admin/*` (legacy admin con ADMIN_PASSWORD) | server-rendered | Sigue activo, no tournament-scoped |
| `/api/lemonsqueezy/webhook` | 200/4xx según payload | Webhook listo, env vars pendientes |
| `/api/register` | 200 | Inscripción público (legacy, todavía usado por /inscribirse) |

**Cero 500s detectados.**

## Pendientes con decisión de Fernando

1. **Home `/` hero hardcodeado TBA** — no auto-lee del view `featured_tournament`. Mientras Papaque #1 está `status='open'`, la home sigue mostrando "Próximo torneo TBA" + countdown vencido. Fix estimado: 15 minutos — cambiar el componente Hero (server component) para query a `featured_tournament` y renderizar dinámicamente con fallback al TBA actual cuando no hay row.

2. **`mailer_autoconfirm`** — actualmente OFF (signup requiere email confirm). ON acelera UX pero abre puerta a bots. Cambio: 1 PATCH a Management API a `/v1/projects/{ref}/config/auth` con `{"mailer_autoconfirm": true}`.

3. **Lemon Squeezy env vars** — esperando que Peter apruebe cuenta. Cuando suceda, setear en Vercel:
   - `LEMONSQUEEZY_API_KEY`
   - `LEMONSQUEEZY_STORE_ID`
   - `LEMONSQUEEZY_VARIANT_ID_TOURNAMENT_ENTRY`
   - `LEMONSQUEEZY_WEBHOOK_SECRET`
   - Y configurar webhook URL en Lemon Squeezy dashboard → `https://papaque.online/api/lemonsqueezy/webhook`.

4. **Edición de torneos** — el wizard `/dashboard/torneos/nuevo` solo CREA. El admin panel `/dashboard/torneos/[slug]` solo cambia status + mark-paid. Si Pedritín necesita editar campos después de crear (ej: cambiar prize pool, agregar refund policy), hay que duplicar el wizard en modo edit o agregar un form de edición.

5. **Link a `/dashboard` desde Navbar público** — intencionalmente afuera para no mezclar audiencias jugador/organizer. Decidir si agregarlo condicionalmente cuando un user logueado tiene organizer record asociado.

6. **Admin endpoints legacy `/api/admin/teams/[id]` y `/api/admin/export`** — NO están tournament-scoped. Si Pedritín entra al admin (ADMIN_PASSWORD) y ve teams de torneos viejos mezclados, agregar filtro `eq('tournament_id', activeId)` en queries.

7. **`/dashboard/torneos/[slug]/editar`** — no existe. Wizard solo crea.

8. **Política `anon_read_teams` (public, true)** — cualquier anónimo puede leer todos los teams de todos los torneos. Si querés ocultar teams de drafts, modificar a `tournament_id in (select id from tournaments where status in ('open','live','closed'))`.

## Landmines / cosas a tener en cuenta

- **Carpeta del proyecto tiene 4 espacios:** `BY THE OLDS TIME    BTOT`. Ha roto Vercel CLI y git push antes. Refactor riesgoso, hacer cuando haya tiempo dedicado.
- **Múltiples sesiones Claude paralelas pueden haber tocado este repo.** Hay 8 worktrees activos bajo `.claude/worktrees/`. Antes de cambios grandes hacer `git -C "<repo>" worktree list` y `git status` en cada uno relevante.
- **`CLAUDE.md` se modifica por un hook auto-inject** de context-mode rules. Queda dirty en cada worktree y NO debe commitearse (la regla global se carga vía hook al inicio de sesión, no necesita estar en el archivo).
- **Wizard guarda en `localStorage`** con key `papaque-tournament-wizard-v1`. Si cambias el shape del schema del wizard, bumpear la key (v2) o tirar el local storage de testers manualmente.
- **Slug uniqueness es global** (unique constraint en `tournaments.slug`). Si querés que dos organizers usen el mismo slug, agregar unique compuesto `(organizer_id, slug)` y dropear el unique global en migration v6.
- **RLS `tournaments_organizer_read_own` + `tournaments_public_read` se solapan**: el organizer ve sus drafts (open=no, está draft) Y todos los públicos. Si querés que vea solo sus propios incluyendo drafts via la primera policy, la segunda igual los expone públicamente cuando son open/live/closed. No es bug; es by design (drafts privados, resto público).
- **`prize_pool_pct` (legacy de v3) sigue en la tabla.** No se borró en v4 para compat. Cuando todos los flows usen `prize_distribution` jsonb, dropearlo en v6.
- **`teams.tournament_id` es NULLABLE.** Backfill de v3 lo llenó para todas las filas existentes, pero un INSERT nuevo podría omitirlo. Agregar NOT NULL en v6 después de auditoría.
- **`/api/register` (legacy) probablemente NO setea tournament_id automáticamente.** Si una inscripción nueva entra vía esa ruta en vez de `/torneos/[slug]/inscribirse`, queda sin tournament_id. Auditar antes del próximo torneo.
- **Hotfix v4 vía Management API ya está en migration files.** Fresh installs (supabase db reset) van a correr clean. Pero si alguien hace pull y aplica solo el diff entre v4-original y v4-fixeado a una DB ya migrada, el `drop view + recreate` se ejecuta de nuevo (es idempotente). Sin impacto.

## Cómo seguir desde VSCode

1. Abrir el repo: `code "C:\Users\ferkm\Desktop\Proyects\Websites\BY THE OLDS TIME    BTOT"`
2. Estás en main, todo está mergeado (commit `cf3ee59`).
3. Pull antes de tocar: `git pull origin main`
4. Para correr local: `npm install && npm run dev` (necesitás `.env.local` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` mínimo).
5. Para deploy: `git push origin main` y Vercel auto-deploya target=production.
6. Si Pedritín necesita signup como organizador en producción, ya funciona — `https://papaque.online/organizer/signup` (email confirmation requerida porque mailer_autoconfirm=false).

### Próximos sprints sugeridos en orden de impacto:

| # | Sprint | Estimación | Impacto |
|---|--------|-----------|---------|
| 1 | Fix home hero dinámico (lee featured_tournament) | 15 min | Alta visibilidad — la home muestra Papaque ya |
| 2 | Configurar Lemon Squeezy cuando Peter apruebe | 1-2 horas | Desbloquea pagos online |
| 3 | Implementar `/dashboard/torneos/[slug]/editar` | 3-4 horas | Pedritín puede ajustar campos post-creación |
| 4 | Tournament-scope a admin endpoints legacy | 1 hora | Evita mezcla de data al crecer |
| 5 | Auto-publicación a Discord/Telegram en status='open' | 4-6 horas | Reduce trabajo manual de Pedritín |
| 6 | Integración Steam API / OpenDota para auto-sync results post-match | 1 sprint completo | Elimina entry manual de match results |
| 7 | Sistema de bracket dinámico (groups + playoffs visualizado) | 1 sprint completo | UX competitiva matchea TI/major brackets |

## Memory hooks (para Claude Code en VSCode)

Si el próximo Claude Code lee `~/.claude/memories` o el equivalente, los hechos clave a recordar:
- Papaque NO es Papá Cuba (corrección de marca importante)
- Dota 2, no otro juego
- Mercado LATAM (Cuba diáspora + Peru + Brazil + Mexico), no solo US
- Ticket único $15/jugador, NO membresía, NO equity tournament
- Lemon Squeezy elegido (no Stripe), pendiente aprobación Peter
- Servers permitidos: US-East, US-West, Peru, Brazil
- Organizador principal: Pedritín (id `f6203ffa-b8cd-48f9-a0a2-a07f9065a166`), WhatsApp +1 832 291 7750
- Margen real Papaque #1 si llena: ~$100 (ingresos $1,200 - prize $1,000 - fees ~$60)
- Hotfix v4 (drop view + format check) ya en repo, no requiere reapply

---

Generado al cierre de sesión Dispatch 2026-05-20 después de aplicar v3-v5 + fix v4 bugs + Auth Redirect URLs config + PR squash-merge + Vercel deploy + verificación end-to-end de rutas en papaque.online.
