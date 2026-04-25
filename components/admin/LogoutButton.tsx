'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="font-mono text-xs text-white/40 hover:text-blood-light border border-white/10 px-3 py-1.5 disabled:opacity-50"
    >
      {loading ? 'Cerrando...' : 'Cerrar sesión'}
    </button>
  );
}
