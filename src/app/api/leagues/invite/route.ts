import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, generateInviteCode } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leagueId } = await req.json();

  const { data: m } = await supabaseAdmin
    .from('league_members').select('role').eq('league_id', leagueId).eq('user_id', user.id).single();
  if (!m || m.role !== 'commissioner')
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const newCode = generateInviteCode();
  await supabaseAdmin.from('leagues').update({ invite_code: newCode }).eq('id', leagueId);

  return NextResponse.json({ inviteCode: newCode });
}
