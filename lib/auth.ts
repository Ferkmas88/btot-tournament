import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabase-server';

export type SessionUser = {
  id: string;
  email: string;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  steam_id_64: string | null;
  steam_persona: string | null;
  steam_avatar_url: string | null;
  mmr_estimate: number | null;
  mmr_self_reported: number | null;
  mmr_cached_at: string | null;
};

export async function getUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '' };
}

export async function requireUser(redirectTo = '/auth/login'): Promise<SessionUser> {
  const user = await getUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('profiles')
    .select(
      'id, email, display_name, steam_id_64, steam_persona, steam_avatar_url, mmr_estimate, mmr_self_reported, mmr_cached_at',
    )
    .eq('id', userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getUser();
  if (!user) return null;
  return getProfile(user.id);
}
