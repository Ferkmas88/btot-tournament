import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/admin-auth';
import LoginForm from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  if (await isAuthed()) {
    redirect('/admin');
  }
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <header className="text-center mb-8">
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-gold/80 mb-2">
            PAPAQUE · ADMIN
          </p>
          <h1 className="font-display text-3xl text-white">Acceso restringido</h1>
        </header>
        <LoginForm />
      </div>
    </div>
  );
}
