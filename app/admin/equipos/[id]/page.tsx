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
  email: string | null;
  steam_id: string | null;
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
    .select('slot, nick, email, steam_id, contact, contact_type, self_mmr, confirmed_at')
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
  const confirmados = members.length;

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
          · Código <span className="text-amber-gold tracking-widest">{team.join_code ?? '—'}</span>{' '}
          ·{' '}
          <span className={confirmados === 4 ? 'text-emerald-400' : 'text-amber-gold'}>
            {confirmados}/4 jugadores confirmados
          </span>
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-6 mb-10">
        <Card title="Capitán">
          <Field label="Nombre">{team.captain_name}</Field>
          <Field label="Email">{team.captain_email ?? '—'}</Field>
          <Field label="Contacto">
            <span className="text-amber-gold/80 mr-1 font-mono">{team.contact_type}</span>
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
            isCaptain
            name={team.captain_name}
            email={team.captain_email}
          />
          {[2, 3, 4, 5].map((s) => {
            const m = memberBySlot.get(s);
            return (
              <PlayerCard
                key={s}
                slot={s}
                name={m?.nick ?? null}
                email={m?.email ?? null}
                pending={!m}
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

function PlayerCard({
  slot,
  name,
  email,
  isCaptain,
  pending,
  confirmedAt,
}: {
  slot: number;
  name: string | null | undefined;
  email: string | null | undefined;
  isCaptain?: boolean;
  pending?: boolean;
  confirmedAt?: string | null;
}) {
  const borderColor = isCaptain
    ? 'border-amber-gold/60'
    : pending
    ? 'border-white/10'
    : 'border-emerald-400/40';

  return (
    <div className={`border ${borderColor} bg-ink-900/40 p-4`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">
          {isCaptain ? 'Capitán · Slot 1' : `Slot ${slot}`}
        </span>
        {isCaptain ? (
          <span className="text-amber-gold font-mono text-[10px]">★ líder</span>
        ) : pending ? (
          <span className="text-white/40 font-mono text-[10px]">pendiente</span>
        ) : (
          <span className="text-emerald-400 font-mono text-[10px]">✓ confirmado</span>
        )}
      </div>
      {pending ? (
        <p className="text-white/40 italic text-sm">
          Esperando que un jugador entre por el link y confirme.
        </p>
      ) : (
        <>
          <div className="font-display text-xl text-white mb-2 truncate">
            {name || 'sin nombre'}
          </div>
          <div className="font-mono text-xs text-white/70 break-all">
            {email ? (
              <a href={`mailto:${email}`} className="hover:text-amber-gold">
                {email}
              </a>
            ) : (
              <span className="text-white/30">sin email</span>
            )}
          </div>
          {confirmedAt && (
            <div className="font-mono text-[10px] text-white/30 mt-2">
              {new Date(confirmedAt).toLocaleString('es-CU', {
                timeZone: 'America/Havana',
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
