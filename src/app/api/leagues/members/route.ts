import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = req.nextUrl.searchParams.get('leagueId');
  const userId   = req.nextUrl.searchParams.get('userId');

  // Verify requester is commissioner
  const { data: m } = await supabaseAdmin
    .from('league_members').select('role').eq('league_id', leagueId).eq('user_id', user.id).single();
  if (!m || m.role !== 'commissioner')
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  await supabaseAdmin.from('league_members')
    .delete().eq('league_id', leagueId).eq('user_id', userId);

  return NextResponse.json({ success: true });
}
