'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROVINCES, type Province } from '@/lib/supabase';

const STORAGE_KEY = 'papaque-wizard-v1';
const TOTAL_STEPS = 5;

type FormData = {
  team_name: string;
  province: Province | '';
  captain_name: string;
  captain_email: string;
  captain_contact: string;
  contact_type: 'whatsapp' | 'telegram';
  player_2_name: string;
  player_2_email: string;
  player_3_name: string;
  player_3_email: string;
  player_4_name: string;
  player_4_email: string;
  player_5_name: string;
  player_5_email: string;
  referral_source: string;
};

const EMPTY: FormData = {
  team_name: '',
  province: '',
  captain_name: '',
  captain_email: '',
  captain_contact: '',
  contact_type: 'whatsapp',
  player_2_name: '',
  player_2_email: '',
  player_3_name: '',
  player_3_email: '',
  player_4_name: '',
  player_4_email: '',
  player_5_name: '',
  player_5_email: '',
  referral_source: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterWizard() {
  const router = useRouter();
  const discord = process.env.NEXT_PUBLIC_DISCORD_INVITE ?? '#';

  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setData((prev) => ({ ...prev, ...parsed.data }));
          if (typeof parsed.step === 'number' && parsed.step >= 1 && parsed.step <= TOTAL_STEPS) {
            setStep(parsed.step);
          }
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data }));
    } catch {
      /* ignore */
    }
  }, [step, data, hydrated]);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function isStepValid(s: number): boolean {
    if (s === 1) return data.team_name.trim().length >= 2 && data.province !== '';
    if (s === 2)
      return (
        data.captain_name.trim().length >= 2 &&
        EMAIL_RE.test(data.captain_email.trim()) &&
        data.captain_contact.trim().length >= 6
      );
    if (s === 3)
      return (
        data.player_2_name.trim().length >= 2 &&
        EMAIL_RE.test(data.player_2_email.trim()) &&
        data.player_3_name.trim().length >= 2 &&
        EMAIL_RE.test(data.player_3_email.trim())
      );
    if (s === 4)
      return (
        data.player_4_name.trim().length >= 2 &&
        EMAIL_RE.test(data.player_4_email.trim()) &&
        data.player_5_name.trim().length >= 2 &&
        EMAIL_RE.test(data.player_5_email.trim())
      );
    if (s === 5) return true;
    return false;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, string> = { ...data };
      if (!payload.referral_source) delete payload.referral_source;

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo registrar');

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="angled-panel mx-auto max-w-xl p-10 text-center">
        <div className="stamp-heading mb-6 border-amber-gold text-amber-gold">Inscrito</div>
        <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
          Tu equipo está <span className="text-amber-gold">dentro</span>
        </h2>
        <p className="text-white/70 mb-8">
          Mandamos email a vos y a tus 4 jugadores con los detalles del torneo: horario, bracket
          y enlaces. Mientras tanto, entrá al Discord — los anuncios viven ahí.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={discord} target="_blank" rel="noopener" className="btn-primary">
            Unirme al Discord →
          </a>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn-secondary"
          >
            Volver al sitio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ProgressBar step={step} total={TOTAL_STEPS} />

      <div className="angled-panel p-6 md:p-10 mt-6">
        {step === 1 && <Step1 data={data} update={update} />}
        {step === 2 && <Step2 data={data} update={update} />}
        {step === 3 && <Step3 data={data} update={update} />}
        {step === 4 && <Step4 data={data} update={update} />}
        {step === 5 && <Step5 data={data} update={update} />}

        {error && (
          <div className="mt-6 p-3 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || submitting}
            className="btn-secondary disabled:opacity-30"
          >
            ← Atrás
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!isStepValid(step)}
              className="btn-primary disabled:opacity-50"
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Inscribiendo...' : 'Inscribir equipo'}
            </button>
          )}
        </div>
      </div>

      <p className="font-mono text-[10px] text-white/30 text-center mt-4 max-w-md mx-auto">
        Tus datos se guardan automáticamente. Si cerrás el navegador y volvés, retomás donde
        quedaste.
      </p>
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = (step / total) * 100;
  return (
    <div>
      <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-white/60 mb-2">
        <span>Paso {step} de {total}</span>
        <span className="text-amber-gold">{stepLabel(step)}</span>
      </div>
      <div className="h-1 bg-white/10 overflow-hidden">
        <div
          className="h-full bg-amber-gold transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function stepLabel(s: number): string {
  return ['Equipo', 'Capitán', 'Jugadores 2 y 3', 'Jugadores 4 y 5', 'Confirmar'][s - 1] ?? '';
}

type StepProps = {
  data: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
};

function Step1({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <StepTitle>Empezamos por tu equipo</StepTitle>
      <Field
        label="Nombre del equipo"
        value={data.team_name}
        onChange={(v) => update('team_name', v)}
        placeholder="Los Tigres del Cerro"
        autoFocus
      />
      <div>
        <label className="label-text">Provincia</label>
        <select
          className="input-field"
          value={data.province}
          onChange={(e) => update('province', e.target.value as Province)}
        >
          <option value="" disabled>
            Selecciona...
          </option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Step2({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <StepTitle>Tus datos como capitán</StepTitle>
      <Field
        label="Tu nombre"
        value={data.captain_name}
        onChange={(v) => update('captain_name', v)}
        placeholder="Juan Pérez"
        autoFocus
      />
      <Field
        label="Tu email"
        type="email"
        value={data.captain_email}
        onChange={(v) => update('captain_email', v)}
        placeholder="juan@email.com"
      />
      <div>
        <label className="label-text">Tu contacto</label>
        <div className="flex gap-2">
          <select
            className="input-field max-w-[150px]"
            value={data.contact_type}
            onChange={(e) => update('contact_type', e.target.value as 'whatsapp' | 'telegram')}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
          </select>
          <input
            className="input-field"
            value={data.captain_contact}
            onChange={(e) => update('captain_contact', e.target.value)}
            placeholder="+53 55555555"
          />
        </div>
      </div>
    </div>
  );
}

function Step3({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <StepTitle>Jugador 2 y 3 del equipo</StepTitle>
      <p className="text-white/60 text-sm -mt-3">
        Necesitamos el nombre y email de cada uno para mandarles los detalles del torneo.
      </p>
      <PlayerFieldset
        slot={2}
        name={data.player_2_name}
        email={data.player_2_email}
        update={update}
      />
      <PlayerFieldset
        slot={3}
        name={data.player_3_name}
        email={data.player_3_email}
        update={update}
      />
    </div>
  );
}

function Step4({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <StepTitle>Jugador 4 y 5 del equipo</StepTitle>
      <PlayerFieldset
        slot={4}
        name={data.player_4_name}
        email={data.player_4_email}
        update={update}
      />
      <PlayerFieldset
        slot={5}
        name={data.player_5_name}
        email={data.player_5_email}
        update={update}
      />

      <div className="pt-4 border-t border-white/10">
        <label className="label-text">¿Dónde nos conociste? (opcional)</label>
        <select
          className="input-field"
          value={data.referral_source}
          onChange={(e) => update('referral_source', e.target.value)}
        >
          <option value="">—</option>
          <option value="whatsapp">WhatsApp de un amigo</option>
          <option value="telegram">Grupo de Telegram</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="youtuber">Un YouTuber/Streamer</option>
          <option value="otro">Otro</option>
        </select>
      </div>
    </div>
  );
}

function Step5({ data }: StepProps) {
  const players = [
    { slot: 2, name: data.player_2_name, email: data.player_2_email },
    { slot: 3, name: data.player_3_name, email: data.player_3_email },
    { slot: 4, name: data.player_4_name, email: data.player_4_email },
    { slot: 5, name: data.player_5_name, email: data.player_5_email },
  ];
  return (
    <div className="space-y-5">
      <StepTitle>Revisá antes de inscribir</StepTitle>
      <div className="space-y-4">
        <SummaryBlock label="Equipo">
          <div className="font-display text-2xl text-white">{data.team_name}</div>
          <div className="font-mono text-xs text-white/60">{data.province}</div>
        </SummaryBlock>

        <SummaryBlock label="Capitán">
          <div className="text-white">{data.captain_name}</div>
          <div className="font-mono text-xs text-white/60 break-all">{data.captain_email}</div>
          <div className="font-mono text-xs text-white/60">
            <span className="text-amber-gold/80 mr-1">{data.contact_type}</span>
            {data.captain_contact}
          </div>
        </SummaryBlock>

        <SummaryBlock label="Jugadores">
          <div className="space-y-2">
            {players.map((p) => (
              <div key={p.slot} className="flex justify-between gap-3 text-sm border-b border-white/5 pb-2 last:border-0">
                <div>
                  <div className="text-white/40 font-mono text-[10px] uppercase">Slot {p.slot}</div>
                  <div className="text-white">{p.name}</div>
                </div>
                <div className="font-mono text-xs text-white/60 break-all text-right self-center">
                  {p.email}
                </div>
              </div>
            ))}
          </div>
        </SummaryBlock>
      </div>
      <p className="font-mono text-[11px] text-white/40 text-center pt-2">
        Si algo está mal, usá <strong>← Atrás</strong> para corregirlo. Si todo está bien, click en
        <strong> Inscribir equipo</strong>.
      </p>
    </div>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl md:text-3xl text-white">{children}</h2>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="label-text">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
        autoFocus={autoFocus}
      />
    </div>
  );
}

function PlayerFieldset({
  slot,
  name,
  email,
  update,
}: {
  slot: 2 | 3 | 4 | 5;
  name: string;
  email: string;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="border border-white/10 p-4 bg-ink-900/40">
      <div className="font-mono text-[11px] tracking-[0.2em] text-amber-gold/80 uppercase mb-3">
        Jugador {slot}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field
          label="Nombre"
          value={name}
          onChange={(v) => update(`player_${slot}_name` as keyof FormData, v)}
          placeholder="Pedro Gómez"
        />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(v) => update(`player_${slot}_email` as keyof FormData, v)}
          placeholder="pedro@email.com"
        />
      </div>
    </div>
  );
}

function SummaryBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/10 bg-ink-900/40 p-4">
      <div className="font-mono text-[10px] tracking-[0.2em] text-amber-gold/80 uppercase mb-3">
        {label}
      </div>
      {children}
    </div>
  );
}
