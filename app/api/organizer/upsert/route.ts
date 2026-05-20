import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth';
import { isSameOrigin } from '@/lib/csrf';
import { getServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const schema = z.object({
  display_name: z.string().trim().min(2).max(80),
  contact_whatsapp: z.string().trim().max(30).nullable().optional(),
  contact_telegram: z.string().trim().max(60).nullable().optional(),
  contact_discord: z.string().trim().max(60).nullable().optional(),
  contact_email: z.string().trim().max(120).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Origin inválido' }, { status: 403 });
  }
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from('organizers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const payload = {
    user_id: user.id,
    display_name: parsed.data.display_name,
    contact_whatsapp: parsed.data.contact_whatsapp ?? null,
    contact_telegram: parsed.data.contact_telegram ?? null,
    contact_discord: parsed.data.contact_discord ?? null,
    contact_email: parsed.data.contact_email ?? user.email,
    bio: parsed.data.bio ?? null,
  };

  if (existing) {
    const { error } = await supabase
      .from('organizers')
      .update(payload)
      .eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, organizer_id: existing.id });
  }

  const { data, error } = await supabase
    .from('organizers')
    .insert(payload)
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, organizer_id: data.id });
}
