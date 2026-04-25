import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthed } from '@/lib/admin-auth';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

type Member = {
  slot: number;
  nick: string;
  steam_id: string;
  contact: string | null;
  contact_type: string | null;
  self_mmr: number | null;
  confirmed_at: string;
};

async function loadTeam(id: string) {
  const supabase = getServiceClient();
  const { data: team } = await supabase.from('teams').select('*').eq('id', id).maybeSingle();
  if (!team) return null;

  const { data: members } = await supabase
    .from('team_members')
    .select('slot, nick, steam_id, contact, contact_type, self_mmr, confirmed_at')
    .eq('team_id', id)
    .order('slot');

  return { team, members: (members ?? []) as Member[] };
}

export default async function TeamDetail({ params }: Params) {
  if (!(await isAuthed())) redirect('/admin/login');

  const { id } = await params;
  const data = await loadTeam(id);
  if (!data) notFound();

  const { team, members } = data;
  const memberBySlot = new Map<number, Member>();
  members.forEach((m) => memberBySlot.set(m.slot, m));

  const totalMmr =
    members.reduce((acc, m) => acc + (m.self_mmr ?? 0), 0) || null;

  const tentativeNicks: Record<number, string> = {
    2: team.player_2,
    3: team.player_3,
    4: team.player_4,
    5: team.player_5,
  };

  return (
    <div>
      <Link href="/admin" className="font-mono text-xs text-white/50 hover:text-white">
        ← volver
      </Link>

      <header className="mt-3 mb-8">
        <h1 className="font-display text-4xl text-white">{team.team_name}</h1>
        <p className="font-mono text-xs text-white/50 mt-2">
          Registrado{' '}
          {new Date(team.created_at).toLocaleString('es-CU', {
            timeZone: 'America/Havana',
            dateStyle: 'medium',
            timeStyle: 'short',
          })}{' '}
          · Código{' '}
          <span className="text-amber-gold tracking-widest">{team.join_code ?? '—'}</span>
          {totalMmr ? (
            <>
              {' '}· MMR auto-reportado total:{' '}
              <span className="text-white">{totalMmr.toLocaleString()}</span>
            </>
          ) : null}
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-6 mb-10">
        <Card title="Capitán">
          <Field label="Nombre">{team.captain_name}</Field>
          <Field label="Steam">{team.captain_steam}</Field>
          <Field label="Contacto">
            <span className="text-amber-gold/80 mr-1 font-mono">
              {team.contact_type}
            </span>
            {team.captain_contact}
          </Field>
          <Field label="Provincia">{team.province}</Field>
        </Card>

        <Card title="Metadata">
          <Field label="Estado">{team.status}</Field>
          <Field label="UTM source">{team.utm_source ?? '—'}</Field>
          <Field label="UTM campaign">{team.utm_campaign ?? '—'}</Field>
          <Field label="Referral">{team.referral_source ?? '—'}</Field>
          {team.notes && <Field label="Notas">{team.notes}</Field>}
        </Card>
      </section>

      <section>
        <h2 className="font-display text-2xl text-white mb-4">Roster</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <PlayerCard
            slot={1}
            nick={team.captain_steam}
            isCaptain
            confirmed
            steamId={team.captain_steam}
          />
          {[2, 3, 4, 5].map((s) => {
            const m = memberBySlot.get(s);
            return (
              <PlayerCard
                key={s}
                slot={s}
                nick={m ? m.nick : tentativeNicks[s]}
                tentative={!m}
                confirmed={!!m}
                steamId={m?.steam_id ?? null}
                contact={m?.contact ?? null}
                contactType={m?.contact_type ?? null}
                mmr={m?.self_mmr ?? null}
                confirmedAt={m?.confirmed_at ?? null}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/10 bg-ink-900/40 p-5">
      <div className="font-mono text-[10px] tracking-[0.2em] text-amber-gold/80 uppercase mb-4">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm border-b border-white/5 pb-2 last:border-b-0">
      <span className="text-white/50 font-mono text-xs">{label}</span>
      <span className="text-white text-right">{children}</span>
    </div>
  );
}

type PlayerCardProps = {
  slot: number;
  nick: string;
  isCaptain?: boolean;
  tentative?: boolean;
  confirmed: boolean;
  steamId?: string | null;
  contact?: string | null;
  contactType?: string | null;
  mmr?: number | null;
  confirmedAt?: string | null;
};

function PlayerCard({
  slot,
  nick,
  isCaptain,
  tentative,
  confirmed,
  steamId,
  contact,
  contactType,
  mmr,
  confirmedAt,
}: PlayerCardProps) {
  const borderColor = isCaptain
    ? 'border-amber-gold/60'
    : confirmed
    ? 'border-emerald-400/40'
    : 'border-white/15';

  return (
    <div className={`border ${borderColor} bg-ink-900/40 p-4`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">
          {isCaptain ? 'Capitán · Slot 1' : `Slot ${slot}`}
        </span>
        {isCaptain ? (
          <span className="text-amber-gold font-mono text-[10px]">★ líder</span>
        ) : confirmed ? (
          <span className="text-emerald-400 font-mono text-[10px]">✓ confirmado</span>
        ) : (
          <span className="text-white/40 font-mono text-[10px]">tentativo</span>
        )}
      </div>
      <div className="font-display text-xl text-white mb-2 truncate">{nick}</div>
      {tentative && (
        <p className="text-white/40 text-xs italic">
          El capitán lo agregó pero todavía no entró al link de confirmación.
        </p>
      )}
      {confirmed && !isCaptain && (
        <div className="space-y-1.5 text-xs font-mono text-white/70 mt-2">
          {steamId && (
            <div>
              <span className="text-white/40">steam:</span> {steamId}
            </div>
          )}
          {mmr !== null && mmr !== undefined && (
            <div>
              <span className="text-white/40">mmr:</span>{' '}
              <span className="text-white">{mmr.toLocaleString()}</span>
            </div>
          )}
          {contact && (
            <div>
              <span className="text-white/40">{contactType}:</span> {contact}
            </div>
          )}
          {confirmedAt && (
            <div className="text-white/40 pt-1">
              {new Date(confirmedAt).toLocaleString('es-CU', {
                timeZone: 'America/Havana',
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </div>
          )}
        </div>
      )}
      {isCaptain && (
        <div className="text-xs font-mono text-white/60">
          <span className="text-white/40">steam:</span> {steamId}
        </div>
      )}
    </div>
  );
}
