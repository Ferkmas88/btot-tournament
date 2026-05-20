'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'papaque-tournament-wizard-v1';
const TOTAL_STEPS = 7;

const FORMATS = [
  { value: 'single_elim', label: 'Single Elimination' },
  { value: 'double_elim', label: 'Double Elimination' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'groups_playoffs', label: 'Grupos + Playoffs' },
] as const;

const GAMES = [
  { value: 'dota2', label: 'Dota 2' },
  { value: 'cs2', label: 'CS2' },
  { value: 'valorant', label: 'Valorant' },
  { value: 'lol', label: 'League of Legends' },
  { value: 'other', label: 'Otro (especificar)' },
] as const;

const PAYMENT_METHODS = [
  { value: 'card', label: 'Tarjeta (Lemon Squeezy)' },
  { value: 'whatsapp_alt', label: 'WhatsApp (WU / Remitly / efectivo / transferencia)' },
] as const;

const SERVERS = [
  'US-East',
  'US-West',
  'Peru',
  'Brazil',
  'Chile',
  'EU-West',
  'EU-East',
  'SE-Asia',
  'Australia',
];

type WizardData = {
  // Step 1 — básicos
  name: string;
  slug: string;
  description: string;
  game: string;
  game_other: string;

  // Step 2 — formato
  format: 'single_elim' | 'double_elim' | 'round_robin' | 'groups_playoffs';
  max_teams: number;
  team_size: number;
  coach_required: boolean;
  substitutes_allowed: number;

  // Step 3 — elegibilidad
  mmr_min: string;
  mmr_max_per_team: string;
  rank_min: string;
  required_immortal_per_team: string;

  // Step 4 — pricing
  entry_fee_per_player_usd: string;
  entry_fee_per_team_usd: string;
  payment_methods: string[];

  // Step 5 — prize pool
  prize_pool_usd: string;
  prize_1st: string;
  prize_2nd: string;
  prize_3rd: string;

  // Step 6 — schedule
  starts_at: string;
  registration_closes_at: string;
  schedule_notes: string;

  // Step 7 — reglas
  servers_allowed: string[];
  anti_cheat_rules: string;
  refund_policy_days: string;
};

const DEFAULTS: WizardData = {
  name: '',
  slug: '',
  description: '',
  game: 'dota2',
  game_other: '',
  format: 'double_elim',
  max_teams: 16,
  team_size: 5,
  coach_required: false,
  substitutes_allowed: 0,
  mmr_min: '',
  mmr_max_per_team: '',
  rank_min: '',
  required_immortal_per_team: '0',
  entry_fee_per_player_usd: '0',
  entry_fee_per_team_usd: '0',
  payment_methods: ['card'],
  prize_pool_usd: '0',
  prize_1st: '',
  prize_2nd: '',
  prize_3rd: '',
  starts_at: '',
  registration_closes_at: '',
  schedule_notes: '',
  servers_allowed: [],
  anti_cheat_rules: '',
  refund_policy_days: '1',
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

type Props = {
  organizerName: string;
};

export default function TournamentWizard({ organizerName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState<null | 'draft' | 'open'>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.data) setData({ ...DEFAULTS, ...parsed.data });
        if (typeof parsed?.step === 'number') setStep(Math.min(TOTAL_STEPS, Math.max(1, parsed.step)));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
    } catch {
      /* ignore */
    }
  }, [step, data, hydrated]);

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-slug si el user no editó manualmente el slug.
      if (key === 'name' && (!prev.slug || prev.slug === slugify(prev.name))) {
        next.slug = slugify(value as string);
      }
      // Auto-team-fee = player_fee × team_size cuando se edita player_fee.
      if (key === 'entry_fee_per_player_usd') {
        const per = Number(value);
        if (Number.isFinite(per) && per >= 0) {
          next.entry_fee_per_team_usd = String(per * next.team_size);
        }
      }
      if (key === 'team_size' && Number(prev.entry_fee_per_player_usd) > 0) {
        next.entry_fee_per_team_usd = String(
          Number(prev.entry_fee_per_player_usd) * (value as number),
        );
      }
      return next;
    });
  }

  function stepError(s: number): string | null {
    if (s === 1) {
      if (data.name.trim().length < 3) return 'El nombre necesita mínimo 3 caracteres';
      if (data.slug.trim().length < 3) return 'El slug necesita mínimo 3 caracteres';
      if (!/^[a-z0-9-]+$/.test(data.slug)) return 'Slug solo lowercase, números y guiones';
      if (data.game === 'other' && data.game_other.trim().length < 2) {
        return 'Especificá el nombre del juego';
      }
    }
    if (s === 2) {
      if (data.max_teams < 2) return 'Mínimo 2 equipos';
      if (data.team_size < 1) return 'Mínimo 1 jugador por equipo';
    }
    if (s === 4) {
      if (data.payment_methods.length === 0) return 'Elegí al menos un método de pago';
      const fee = Number(data.entry_fee_per_team_usd);
      if (Number.isNaN(fee) || fee < 0) return 'Entry fee inválido';
    }
    if (s === 5) {
      const pool = Number(data.prize_pool_usd);
      if (Number.isNaN(pool) || pool < 0) return 'Prize pool inválido';
      const splits = [data.prize_1st, data.prize_2nd, data.prize_3rd].map((n) => Number(n || 0));
      const sum = splits.reduce((a, b) => a + b, 0);
      if (pool > 0 && sum > 0 && Math.abs(sum - pool) > 0.01) {
        return `Distribución (${sum}) no suma el prize pool (${pool})`;
      }
    }
    if (s === 7) {
      const days = Number(data.refund_policy_days);
      if (Number.isNaN(days) || days < 0) return 'Días reembolso inválido';
    }
    return null;
  }

  const currentError = stepError(step);

  function tryAdvance() {
    if (currentError) {
      setError(currentError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  async function submit(status: 'draft' | 'open') {
    // Validar todos los steps antes de submit.
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      const err = stepError(s);
      if (err) {
        setStep(s);
        setError(err);
        return;
      }
    }
    setSubmitting(status);
    setError(null);
    try {
      const payload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description.trim() || null,
        game: data.game === 'other' ? data.game_other.trim().toLowerCase() : data.game,
        format: data.format,
        max_teams: data.max_teams,
        team_size: data.team_size,
        coach_required: data.coach_required,
        substitutes_allowed: data.substitutes_allowed,
        mmr_min: numOrNull(data.mmr_min),
        mmr_max_per_team: numOrNull(data.mmr_max_per_team),
        rank_min: data.rank_min.trim() || null,
        required_immortal_per_team: Number(data.required_immortal_per_team) || 0,
        entry_fee_per_player_usd: Number(data.entry_fee_per_player_usd) || 0,
        entry_fee_per_team_usd: Number(data.entry_fee_per_team_usd) || 0,
        payment_methods: data.payment_methods,
        prize_pool_usd: Number(data.prize_pool_usd) || 0,
        prize_distribution: buildDistribution(data),
        starts_at: data.starts_at || null,
        registration_closes_at: data.registration_closes_at || null,
        schedule_notes: data.schedule_notes.trim() || null,
        servers_allowed: data.servers_allowed,
        anti_cheat_rules: data.anti_cheat_rules.trim() || null,
        refund_policy_days: Number(data.refund_policy_days) || 0,
        status,
      };
      const res = await fetch('/api/dashboard/tournaments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No pudimos crear el torneo');
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      router.push(`/dashboard/torneos/${json.slug}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      setSubmitting(null);
    }
  }

  return (
    <div>
      <ProgressBar step={step} total={TOTAL_STEPS} />

      <div className="angled-panel p-6 md:p-10 mt-6">
        {step === 1 && <Step1 data={data} update={update} />}
        {step === 2 && <Step2 data={data} update={update} />}
        {step === 3 && <Step3 data={data} update={update} />}
        {step === 4 && <Step4 data={data} update={update} />}
        {step === 5 && <Step5 data={data} update={update} />}
        {step === 6 && <Step6 data={data} update={update} />}
        {step === 7 && (
          <Step7
            data={data}
            update={update}
            organizerName={organizerName}
          />
        )}

        {error && (
          <div className="mt-6 p-3 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || !!submitting}
            className="btn-secondary disabled:opacity-30"
          >
            ← Atrás
          </button>

          {step < TOTAL_STEPS ? (
            <button type="button" onClick={tryAdvance} className="btn-primary">
              Siguiente →
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => submit('draft')}
                disabled={!!submitting}
                className="btn-secondary"
              >
                {submitting === 'draft' ? 'Guardando...' : 'Guardar borrador'}
              </button>
              <button
                type="button"
                onClick={() => submit('open')}
                disabled={!!submitting}
                className="btn-primary"
              >
                {submitting === 'open' ? 'Publicando...' : 'Publicar torneo →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function numOrNull(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function buildDistribution(d: WizardData): Record<string, number> | null {
  const dist: Record<string, number> = {};
  if (Number(d.prize_1st) > 0) dist['1st'] = Number(d.prize_1st);
  if (Number(d.prize_2nd) > 0) dist['2nd'] = Number(d.prize_2nd);
  if (Number(d.prize_3rd) > 0) dist['3rd'] = Number(d.prize_3rd);
  return Object.keys(dist).length ? dist : null;
}

type StepProps = {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
};

function Step1({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-white">1 · Básicos</h2>

      <FieldText
        label="Nombre del torneo"
        value={data.name}
        onChange={(v) => update('name', v)}
        placeholder="P'APA QUE!? — Torneo Dota 2"
        maxLength={120}
        required
      />

      <FieldText
        label="Slug (en la URL: /torneos/{slug})"
        value={data.slug}
        onChange={(v) => update('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
        placeholder="papaque-2"
        maxLength={60}
        required
        mono
      />

      <div>
        <label className="label-text">Descripción corta (opcional)</label>
        <textarea
          value={data.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Torneo LATAM Dota 2 con prize pool USD 1000..."
          className="input-field min-h-[80px]"
          maxLength={500}
        />
      </div>

      <div>
        <label className="label-text">Juego</label>
        <select
          value={data.game}
          onChange={(e) => update('game', e.target.value)}
          className="input-field"
        >
          {GAMES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {data.game === 'other' && (
        <FieldText
          label="¿Qué juego?"
          value={data.game_other}
          onChange={(v) => update('game_other', v)}
          placeholder="ej: rocket-league"
          maxLength={40}
          required
        />
      )}
    </div>
  );
}

function Step2({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-white">2 · Formato</h2>

      <div>
        <label className="label-text">Modalidad</label>
        <div className="space-y-2">
          {FORMATS.map((f) => (
            <label key={f.value} className="flex items-center gap-3 border border-white/10 hover:border-white/25 px-3 py-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                checked={data.format === f.value}
                onChange={() => update('format', f.value)}
              />
              <span className="text-white text-sm">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-text">Equipos máx</label>
          <select
            value={data.max_teams}
            onChange={(e) => update('max_teams', Number(e.target.value))}
            className="input-field"
          >
            {[4, 8, 16, 24, 32, 64].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <FieldNumber
          label="Jugadores por equipo"
          value={data.team_size}
          onChange={(v) => update('team_size', v)}
          min={1}
          max={11}
        />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={data.coach_required}
          onChange={(e) => update('coach_required', e.target.checked)}
        />
        <span className="text-white text-sm">Coach obligatorio</span>
      </label>

      <FieldNumber
        label="Sustitutos permitidos"
        value={data.substitutes_allowed}
        onChange={(v) => update('substitutes_allowed', v)}
        min={0}
        max={5}
      />
    </div>
  );
}

function Step3({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-white">3 · Elegibilidad</h2>
      <p className="text-white/55 text-xs">
        Campos opcionales. Aplican principalmente a Dota 2 / juegos con MMR público.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <FieldText
          label="MMR mínimo (opcional)"
          value={data.mmr_min}
          onChange={(v) => update('mmr_min', v.replace(/[^0-9]/g, ''))}
          placeholder="ej: 4000"
          maxLength={6}
        />
        <FieldText
          label="MMR máx por equipo (opcional)"
          value={data.mmr_max_per_team}
          onChange={(v) => update('mmr_max_per_team', v.replace(/[^0-9]/g, ''))}
          placeholder="ej: 30000"
          maxLength={6}
        />
      </div>

      <FieldText
        label="Rank mínimo (opcional)"
        value={data.rank_min}
        onChange={(v) => update('rank_min', v)}
        placeholder="ej: divine_1, immortal, ancient_5"
        maxLength={40}
      />

      <FieldText
        label="Immortals requeridos por equipo (Dota)"
        value={data.required_immortal_per_team}
        onChange={(v) => update('required_immortal_per_team', v.replace(/[^0-9]/g, ''))}
        placeholder="0"
        maxLength={2}
      />
    </div>
  );
}

function Step4({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-white">4 · Pricing</h2>

      <div className="grid grid-cols-2 gap-3">
        <FieldText
          label="USD por jugador"
          value={data.entry_fee_per_player_usd}
          onChange={(v) => update('entry_fee_per_player_usd', v.replace(/[^0-9.]/g, ''))}
          placeholder="15"
          maxLength={8}
        />
        <FieldText
          label="USD por equipo (autocompleta)"
          value={data.entry_fee_per_team_usd}
          onChange={(v) => update('entry_fee_per_team_usd', v.replace(/[^0-9.]/g, ''))}
          placeholder="75"
          maxLength={8}
        />
      </div>

      <p className="font-mono text-[11px] text-white/50">
        El cobro real es por equipo (1 transacción = 1 equipo). El valor por jugador es solo display
        ("$15/jugador").
      </p>

      <div>
        <label className="label-text">Métodos de pago aceptados</label>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((m) => (
            <label key={m.value} className="flex items-center gap-3 border border-white/10 hover:border-white/25 px-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.payment_methods.includes(m.value)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...data.payment_methods, m.value]
                    : data.payment_methods.filter((p) => p !== m.value);
                  update('payment_methods', next);
                }}
              />
              <span className="text-white text-sm">{m.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5({ data, update }: StepProps) {
  const pool = Number(data.prize_pool_usd) || 0;
  const splits = [Number(data.prize_1st) || 0, Number(data.prize_2nd) || 0, Number(data.prize_3rd) || 0];
  const sum = splits.reduce((a, b) => a + b, 0);
  const diff = pool - sum;

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-white">5 · Prize pool</h2>

      <FieldText
        label="Prize pool total (USD)"
        value={data.prize_pool_usd}
        onChange={(v) => update('prize_pool_usd', v.replace(/[^0-9.]/g, ''))}
        placeholder="1000"
        maxLength={10}
      />

      <div>
        <label className="label-text">Distribución</label>
        <div className="grid grid-cols-3 gap-3">
          <FieldText
            label="1° (USD)"
            value={data.prize_1st}
            onChange={(v) => update('prize_1st', v.replace(/[^0-9.]/g, ''))}
            placeholder="600"
            maxLength={10}
          />
          <FieldText
            label="2° (USD)"
            value={data.prize_2nd}
            onChange={(v) => update('prize_2nd', v.replace(/[^0-9.]/g, ''))}
            placeholder="200"
            maxLength={10}
          />
          <FieldText
            label="3° (USD)"
            value={data.prize_3rd}
            onChange={(v) => update('prize_3rd', v.replace(/[^0-9.]/g, ''))}
            placeholder="200"
            maxLength={10}
          />
        </div>
      </div>

      {pool > 0 && sum > 0 && (
        <div
          className={`font-mono text-xs p-3 border ${
            Math.abs(diff) < 0.01
              ? 'border-emerald-400/40 text-emerald-300 bg-emerald-400/5'
              : 'border-blood/40 text-blood-light bg-blood/10'
          }`}
        >
          {Math.abs(diff) < 0.01
            ? `✓ Distribución suma USD ${sum.toFixed(2)} = prize pool.`
            : `Distribución actual: USD ${sum.toFixed(2)}. Falta/sobra: USD ${diff.toFixed(2)}.`}
        </div>
      )}
    </div>
  );
}

function Step6({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-white">6 · Schedule</h2>

      <div>
        <label className="label-text">Fecha de inicio</label>
        <input
          type="datetime-local"
          value={data.starts_at}
          onChange={(e) => update('starts_at', e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label className="label-text">Cierre de inscripciones</label>
        <input
          type="datetime-local"
          value={data.registration_closes_at}
          onChange={(e) => update('registration_closes_at', e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label className="label-text">Notas del schedule (opcional)</label>
        <textarea
          value={data.schedule_notes}
          onChange={(e) => update('schedule_notes', e.target.value)}
          placeholder="Viernes: Grupos A-B. Sábado: Grupos C-D + Quarterfinals. Domingo: Semis y Final."
          className="input-field min-h-[100px]"
          maxLength={1000}
        />
      </div>
    </div>
  );
}

function Step7({
  data,
  update,
  organizerName,
}: StepProps & { organizerName: string }) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-white">7 · Reglas y review</h2>

      <div>
        <label className="label-text">Servers permitidos</label>
        <div className="flex flex-wrap gap-2">
          {SERVERS.map((s) => {
            const active = data.servers_allowed.includes(s);
            return (
              <button
                type="button"
                key={s}
                onClick={() => {
                  const next = active
                    ? data.servers_allowed.filter((x) => x !== s)
                    : [...data.servers_allowed, s];
                  update('servers_allowed', next);
                }}
                className={`font-mono text-[11px] uppercase tracking-[0.15em] border px-3 py-1.5 ${
                  active
                    ? 'border-amber-gold bg-amber-gold/15 text-amber-gold'
                    : 'border-white/15 text-white/55 hover:border-white/30'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label-text">Reglas anti-cheat (opcional)</label>
        <textarea
          value={data.anti_cheat_rules}
          onChange={(e) => update('anti_cheat_rules', e.target.value)}
          placeholder="Smurfs prohibidos. VPN no permitido durante partidas. Stream con delay 5min..."
          className="input-field min-h-[100px]"
          maxLength={2000}
        />
      </div>

      <FieldText
        label="Política reembolsos: días antes del torneo permite reembolso"
        value={data.refund_policy_days}
        onChange={(v) => update('refund_policy_days', v.replace(/[^0-9]/g, ''))}
        placeholder="1"
        maxLength={3}
      />

      <Review data={data} organizerName={organizerName} />
    </div>
  );
}

function Review({ data, organizerName }: { data: WizardData; organizerName: string }) {
  const game = useMemo(
    () => (data.game === 'other' ? data.game_other : GAMES.find((g) => g.value === data.game)?.label ?? data.game),
    [data.game, data.game_other],
  );
  const format = FORMATS.find((f) => f.value === data.format)?.label ?? data.format;

  return (
    <div className="border border-white/15 bg-black/35 p-5 mt-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-gold/80 mb-3">
        Review
      </div>
      <ReviewRow label="Organizador" value={organizerName} />
      <ReviewRow label="Nombre" value={data.name || '—'} />
      <ReviewRow label="Slug" value={data.slug || '—'} mono />
      <ReviewRow label="Juego · Formato" value={`${game} · ${format}`} />
      <ReviewRow label="Equipos máx" value={String(data.max_teams)} />
      <ReviewRow label="Tamaño equipo" value={`${data.team_size} jugadores${data.coach_required ? ' + coach' : ''}`} />
      <ReviewRow
        label="Entry fee"
        value={
          Number(data.entry_fee_per_team_usd) > 0
            ? `USD ${data.entry_fee_per_team_usd}/equipo (${data.team_size} × USD ${data.entry_fee_per_player_usd})`
            : 'Gratis'
        }
      />
      <ReviewRow label="Prize pool" value={`USD ${data.prize_pool_usd || 0}`} />
      <ReviewRow label="Servers" value={data.servers_allowed.length ? data.servers_allowed.join(', ') : '—'} />
      <ReviewRow
        label="Métodos pago"
        value={data.payment_methods.join(', ') || '—'}
      />
    </div>
  );
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</span>
      <span className={`text-white text-sm text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function FieldText({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  required,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="label-text">
        {label}
        {required && <span className="text-blood-light"> *</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`input-field ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="label-text">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="input-field"
      />
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-white/60 mb-2">
        <span>
          Paso {step} de {total}
        </span>
        <span className="text-amber-gold">
          {['Básicos', 'Formato', 'Elegibilidad', 'Pricing', 'Prize pool', 'Schedule', 'Reglas'][step - 1]}
        </span>
      </div>
      <div className="h-1 bg-white/10 overflow-hidden">
        <div
          className="h-full bg-amber-gold transition-all duration-300"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
