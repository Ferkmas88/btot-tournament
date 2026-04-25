'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password') || '');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesión');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-ink-900/60 border border-blood/30 p-6 space-y-4">
      <div>
        <label className="label-text">Password</label>
        <input
          name="password"
          type="password"
          required
          autoFocus
          className="input-field"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <div className="p-3 border border-blood bg-blood/10 text-blood-light text-sm font-mono">
          {error}
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
