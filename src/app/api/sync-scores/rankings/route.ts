import { NextRequest, NextResponse } from 'next/server';
import { syncRankingsToDatabase } from '@/lib/datagolf';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchPGASchedule } from '@/lib/espn';

// Weekly cron: syncs OWGR rankings + imports ESPN schedule
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Sync OWGR rankings from DataGolf
    const rankingResult = await syncRankingsToDatabase();

    // 2. Sync PGA Tour schedule from ESPN
    const schedule = await fetchPGASchedule();
    let tournamentsSynced = 0;

    for (const event of schedule) {
      const { error } = await supabaseAdmin
        .from('tournaments')
        .upsert({
          espn_event_id: event.espn_event_id,
          name:          event.name,
          type:          event.type,
          season:        event.season,
          start_date:    event.start_date,
          end_date:      event.end_date,
          // Pick deadline = Thursday 7am ET (roughly first tee time)
          pick_deadline: new Date(new Date(event.start_date).getTime() - 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'espn_event_id', ignoreDuplicates: false });

      if (!error) tournamentsSynced++;
    }

    return NextResponse.json({
      success: true,
      rankings: rankingResult,
      tournaments: tournamentsSynced,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
