import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/players?tier=top|dark|all&search=name
export async function GET(req: NextRequest) {
  const tier   = req.nextUrl.searchParams.get('tier') ?? 'all';
  const search = req.nextUrl.searchParams.get('search') ?? '';

  let query = supabaseAdmin
    .from('golfers')
    .select('id, espn_id, name, owgr_rank, is_dark_horse, headshot_url, country')
    .order('owgr_rank', { ascending: true, nullsFirst: false })
    .limit(100);

  if (tier === 'top')  query = query.eq('is_dark_horse', false);
  if (tier === 'dark') query = query.eq('is_dark_horse', true);
  if (search)          query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ golfers: data ?? [] });
}
