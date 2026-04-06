// ============================================================
// SUPABASE CLIENT
// ============================================================

import { createClient } from '@supabase/supabase-js';

// ── Browser client (use in Client Components) ────────────────
export function createBrowserSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Admin client — service role, bypasses RLS ────────────────
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── League Helpers ───────────────────────────────────────────
export async function getLeagueBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('leagues').select('*').eq('slug', slug).single();
  if (error) return null;
  return data;
}

export async function getLeagueMembers(leagueId: string) {
  const { data } = await supabaseAdmin
    .from('league_members').select('*, profile:profiles(*)').eq('league_id', leagueId);
  return data ?? [];
}

export async function getActiveTournament() {
  const { data } = await supabaseAdmin
    .from('tournaments').select('*')
    .in('status', ['active', 'cut_made'])
    .order('start_date', { ascending: true }).limit(1).single();
  return data;
}

export async function getUpcomingTournaments(limit = 5) {
  const { data } = await supabaseAdmin
    .from('tournaments').select('*').eq('status', 'upcoming')
    .order('start_date', { ascending: true }).limit(limit);
  return data ?? [];
}

export async function getPicksForTournament(leagueId: string, tournamentId: string) {
  const { data } = await supabaseAdmin
    .from('picks')
    .select(`*, golfer_1:golfers!picks_golfer_1_id_fkey(*), golfer_2:golfers!picks_golfer_2_id_fkey(*), golfer_3:golfers!picks_golfer_3_id_fkey(*), golfer_4:golfers!picks_golfer_4_id_fkey(*)`)
    .eq('league_id', leagueId).eq('tournament_id', tournamentId);
  return data ?? [];
}

export async function getScoresForTournament(tournamentId: string) {
  const { data } = await supabaseAdmin
    .from('scores').select('*').eq('tournament_id', tournamentId);
  return data ?? [];
}

export async function getFantasyLeaderboard(leagueId: string, tournamentId: string) {
  const { data } = await supabaseAdmin
    .from('fantasy_results').select('*, profile:profiles(*)')
    .eq('league_id', leagueId).eq('tournament_id', tournamentId)
    .order('rank', { ascending: true });
  return data ?? [];
}

export async function getSeasonStandings(leagueId: string, season: number) {
  const { data } = await supabaseAdmin
    .from('season_standings').select('*, profile:profiles(*)')
    .eq('league_id', leagueId).eq('season', season)
    .order('rank', { ascending: true });
  return data ?? [];
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
