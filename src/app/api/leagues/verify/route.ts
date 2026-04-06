// GET /api/leagues/verify?slug=xxx&code=yyy
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  const code = req.nextUrl.searchParams.get('code');

  if (!slug || !code) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const { data: league } = await supabaseAdmin
    .from('leagues').select('id, name').eq('slug', slug).eq('invite_code', code).single();

  if (!league) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });

  return NextResponse.json({ leagueName: league.name });
}
