import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, generateInviteCode } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { name, slug } = await req.json();

  if (!name || !slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: 'Slug must be lowercase letters, numbers, and hyphens only' }, { status: 400 });
  if (slug.length < 2 || slug.length > 40) return NextResponse.json({ error: 'Slug must be 2–40 characters' }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from('leagues').select('id').eq('slug', slug).single();
  if (existing) return NextResponse.json({ error: 'That URL is already taken. Please choose another.' }, { status: 409 });

  const inviteCode = generateInviteCode();
  const { data: league, error } = await supabaseAdmin
    .from('leagues')
    .insert({ name, slug, invite_code: inviteCode, commissioner_id: user.id })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from('league_members').insert({ league_id: league.id, user_id: user.id, role: 'commissioner' });

  return NextResponse.json({ league, inviteUrl: `/join/${slug}/${inviteCode}` });
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: memberships } = await supabaseAdmin
    .from('league_members').select('role, leagues(*)').eq('user_id', user.id);

  return NextResponse.json({ leagues: memberships?.map((m: any) => ({ ...m.leagues, role: m.role })) ?? [] });
}
