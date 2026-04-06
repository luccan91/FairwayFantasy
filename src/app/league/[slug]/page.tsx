import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin, getLeagueBySlug, getLeagueMembers, getActiveTournament, getFantasyLeaderboard, getSeasonStandings, getUpcomingTournaments } from '@/lib/supabase';
import { formatScore } from '@/lib/scoring';
import Nav from '@/components/layout/Nav';
import type { Metadata } from 'next';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const league = await getLeagueBySlug(params.slug);
  return { title: league ? `${league.name} — Leaderboard` : 'League Not Found' };
}

export default async function LeaguePage({ params }: Props) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/signin?redirect=/league/${params.slug}`);

  const league = await getLeagueBySlug(params.slug);
  if (!league) notFound();

  // Verify membership
  const { data: membership } = await supabaseAdmin
    .from('league_members').select('role').eq('league_id', league.id).eq('user_id', user.id).single();
  if (!membership) redirect(`/join/${params.slug}/${league.invite_code}`);

  const { data: profile } = await supabaseAdmin.from('profiles').select('display_name').eq('id', user.id).single();

  const [members, activeTournament, upcoming, standings] = await Promise.all([
    getLeagueMembers(league.id),
    getActiveTournament(),
    getUpcomingTournaments(4),
    getSeasonStandings(league.id, new Date().getFullYear()),
  ]);

  const leaderboard = activeTournament
    ? await getFantasyLeaderboard(league.id, activeTournament.id)
    : [];

  // Get current user's pick for active tournament
  let myPick = null;
  if (activeTournament) {
    const { data } = await supabaseAdmin
      .from('picks')
      .select('*, golfer_1:golfers!picks_golfer_1_id_fkey(name,owgr_rank), golfer_2:golfers!picks_golfer_2_id_fkey(name,owgr_rank), golfer_3:golfers!picks_golfer_3_id_fkey(name,owgr_rank), golfer_4:golfers!picks_golfer_4_id_fkey(name,owgr_rank)')
      .eq('league_id', league.id).eq('tournament_id', activeTournament.id).eq('user_id', user.id).single();
    myPick = data;
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/join/${league.slug}/${league.invite_code}`;
  const nextTournament = upcoming.find((t: any) => t.id !== activeTournament?.id);

  return (
    <div className="page-shell">
      <Nav leagueSlug={params.slug} leagueName={league.name} userName={profile?.display_name} />

      {/* Hero */}
      <div className="t-hero" style={{ padding: '2.5rem 1.5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.4rem' }}>
                Private League
              </p>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900 }}>
                {league.name}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.3rem', fontSize: '0.875rem' }}>
                {members.length} player{members.length !== 1 ? 's' : ''} · {new Date().getFullYear()} season
                {membership.role === 'commissioner' && <span style={{ marginLeft: '0.75rem', color: 'var(--brass-light)' }}>★ Commissioner</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {(activeTournament || nextTournament) && (
                <Link href={`/league/${params.slug}/picks`} className="btn btn-brass">
                  📋 {myPick ? 'View My Picks' : 'Submit Picks'}
                </Link>
              )}
              {membership.role === 'commissioner' && (
                <Link href={`/league/${params.slug}/admin`} className="btn btn-outline-white btn-sm">
                  ⚙️ Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>

            {/* Main content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* Active Tournament */}
              {activeTournament ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      {activeTournament.type === 'major' && (
                        <div className="major-badge" style={{ marginBottom: '0.5rem' }}>🏆 Major Championship</div>
                      )}
                      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700 }}>
                        {activeTournament.name}
                      </h2>
                      {activeTournament.course_name && (
                        <p style={{ color: 'var(--slate-mid)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                          {activeTournament.course_name}
                        </p>
                      )}
                    </div>
                    <span className="badge badge-live">🔴 Live</span>
                  </div>

                  {/* My Pick summary */}
                  {myPick ? (
                    <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--green-mid)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>My Pick</p>
                        <Link href={`/league/${params.slug}/picks`} className="btn btn-ghost btn-sm">Edit</Link>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {[myPick.golfer_1, myPick.golfer_2, myPick.golfer_3, myPick.golfer_4].map((g: any, i: number) => g && (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <span className={`badge ${i < 2 ? 'badge-green' : 'badge-brass'}`} style={{ fontSize: '0.62rem' }}>
                              {i < 2 ? 'Top' : 'DH'}
                            </span>
                            <span style={{ fontWeight: 600 }}>{g.name}</span>
                            <span style={{ color: 'var(--slate-mid)', fontSize: '0.78rem' }}>#{g.owgr_rank}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-warn" style={{ marginBottom: '1rem' }}>
                      ⚠️ You haven't submitted picks for this tournament yet.{' '}
                      <Link href={`/league/${params.slug}/picks`} style={{ fontWeight: 700, color: 'inherit' }}>Submit now →</Link>
                    </div>
                  )}

                  {/* Leaderboard */}
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="lb-table">
                      <thead>
                        <tr>
                          <th style={{ width: 48 }}>#</th>
                          <th>Player</th>
                          <th className="hide-mobile">Golfers</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-mid)' }}>
                              No picks submitted yet — be the first!
                            </td>
                          </tr>
                        ) : leaderboard.map((r: any, i: number) => (
                          <tr key={r.user_id} className={`rank-${i + 1}`}>
                            <td><span className="rank-num">{r.rank ?? i + 1}</span></td>
                            <td>
                              <strong style={{ fontSize: '0.95rem' }}>{r.profile?.display_name ?? 'Player'}</strong>
                              {r.user_id === user.id && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: 'var(--brass)' }}>← you</span>}
                            </td>
                            <td className="hide-mobile" style={{ fontSize: '0.78rem', color: 'var(--slate-mid)' }}>
                              {r.counting_golfers?.length ? `Top ${r.counting_golfers.length} counting` : '—'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <strong className={r.total_score < 0 ? 'score-under' : r.total_score > 0 ? 'score-over' : 'score-even'}>
                                {formatScore(r.total_score)}
                              </strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗓️</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', marginBottom: '0.5rem' }}>No Active Tournament</h3>
                  <p style={{ color: 'var(--slate-mid)', marginBottom: '1.5rem' }}>
                    {nextTournament
                      ? `Next: ${nextTournament.name} — ${new Date(nextTournament.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                      : 'Check back soon.'}
                  </p>
                  {nextTournament && (
                    <Link href={`/league/${params.slug}/picks`} className="btn btn-primary">
                      Submit Picks for {nextTournament.name} →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Season standings */}
              <div className="card">
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                  {new Date().getFullYear()} Standings
                </h3>
                {standings.length === 0 ? (
                  <p style={{ color: 'var(--slate-mid)', fontSize: '0.875rem' }}>No results yet this season.</p>
                ) : standings.map((s: any, i: number) => (
                  <div key={s.user_id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.6rem 0', borderBottom: i < standings.length - 1 ? '1px solid var(--cream-dark)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <span style={{
                        fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem', width: 18,
                        color: i === 0 ? '#b8860b' : i === 1 ? '#808080' : i === 2 ? '#a0522d' : 'var(--slate-mid)',
                      }}>{i + 1}</span>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: s.user_id === user.id ? 700 : 500 }}>
                          {s.profile?.display_name}
                          {s.user_id === user.id && <span style={{ color: 'var(--brass)', marginLeft: '0.3rem', fontSize: '0.7rem' }}>you</span>}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-mid)' }}>{s.tournaments_played} events</div>
                      </div>
                    </div>
                    <strong className={s.total_score < 0 ? 'score-under' : s.total_score > 0 ? 'score-over' : 'score-even'} style={{ fontSize: '0.95rem' }}>
                      {formatScore(s.total_score)}
                    </strong>
                  </div>
                ))}
              </div>

              {/* Roster */}
              <div className="card">
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                  League Roster
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {members.map((m: any) => (
                    <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: m.user_id === user.id ? 700 : 400 }}>
                        {m.profile?.display_name}
                        {m.user_id === user.id && <span style={{ color: 'var(--slate-mid)', marginLeft: '0.3rem', fontSize: '0.75rem' }}>(you)</span>}
                      </span>
                      {m.role === 'commissioner' && <span className="badge badge-brass" style={{ fontSize: '0.62rem' }}>★ Comm</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite */}
              <div className="card card-green">
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Invite Players
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Share this link — anyone who clicks it can join.
                </p>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.6rem 0.75rem', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--brass-light)', wordBreak: 'break-all', marginBottom: '0.75rem' }}>
                  /join/{league.slug}/{league.invite_code}
                </div>
                <button
                  className="btn btn-brass btn-sm btn-full"
                  onClick={() => { if (typeof window !== 'undefined') navigator.clipboard?.writeText(inviteUrl); }}
                >
                  📋 Copy Invite Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
