'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatScore } from '@/lib/scoring';

interface Golfer {
  id: string; espn_id: string; name: string;
  owgr_rank: number | null; is_dark_horse: boolean;
  headshot_url: string | null; country: string | null;
}

interface Tournament {
  id: string; name: string; type: string; start_date: string;
  pick_deadline: string | null; status: string; cut_score: number | null;
}

type Slot = 0 | 1 | 2 | 3;
const SLOT_LABELS = ['Top Tier #1', 'Top Tier #2', 'Dark Horse #1', 'Dark Horse #2'];
const SLOT_HELP   = ['OWGR ranked 1–24', 'OWGR ranked 1–24', 'OWGR ranked 25+', 'OWGR ranked 25+'];

export default function PicksPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [tournament, setTournament]   = useState<Tournament | null>(null);
  const [golfers, setGolfers]         = useState<Golfer[]>([]);
  const [selected, setSelected]       = useState<(Golfer | null)[]>([null, null, null, null]);
  const [activeSlot, setActiveSlot]   = useState<Slot | null>(null);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [errors, setErrors]           = useState<string[]>([]);
  const [success, setSuccess]         = useState(false);
  const [leagueId, setLeagueId]       = useState('');
  const [alreadyPicked, setAlreadyPicked] = useState<string[]>([]); // golfer IDs taken by others

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/picks/setup?slug=${slug}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setTournament(data.tournament);
      setGolfers(data.golfers);
      setLeagueId(data.leagueId);
      setAlreadyPicked(data.alreadyPickedIds ?? []);

      // Load existing pick if any
      if (data.existingPick) {
        const ep = data.existingPick;
        const findG = (id: string) => data.golfers.find((g: Golfer) => g.id === id) ?? null;
        setSelected([findG(ep.golfer_1_id), findG(ep.golfer_2_id), findG(ep.golfer_3_id), findG(ep.golfer_4_id)]);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const filteredGolfers = useCallback(() => {
    const q = search.toLowerCase();
    return golfers.filter(g => {
      if (!g.name.toLowerCase().includes(q)) return false;
      // Filter by tier for active slot
      if (activeSlot !== null) {
        if (activeSlot < 2 && g.is_dark_horse) return false; // top tier slots
        if (activeSlot >= 2 && !g.is_dark_horse) return false; // dark horse slots
      }
      return true;
    });
  }, [golfers, search, activeSlot]);

  function selectGolfer(golfer: Golfer) {
    if (activeSlot === null) return;
    // Remove from other slots if already selected
    const newSelected = selected.map((g, i) => {
      if (i === activeSlot) return golfer;
      if (g?.id === golfer.id) return null;
      return g;
    });
    setSelected(newSelected);
    setActiveSlot(null);
    setSearch('');
    setErrors([]);
  }

  function removeGolfer(slot: Slot) {
    const ns = [...selected]; ns[slot] = null; setSelected(ns);
  }

  async function handleSubmit() {
    setErrors([]); setSaving(true);
    const res = await fetch('/api/picks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leagueId,
        tournamentId: tournament?.id,
        golferIds: selected.map(g => g?.id ?? null),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setErrors(data.errors ?? [data.error]); return; }
    setSuccess(true);
    setTimeout(() => router.push(`/league/${slug}`), 2000);
  }

  const deadline = tournament?.pick_deadline ? new Date(tournament.pick_deadline) : null;
  const isLocked = tournament?.status !== 'upcoming';
  const allSelected = selected.every(Boolean);

  if (loading) {
    return (
      <div className="page-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: 'var(--slate-mid)' }}>Loading…</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="page-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗓️</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Upcoming Tournament</h2>
          <p style={{ color: 'var(--slate-mid)', marginBottom: '1.5rem' }}>Check back when the next event is scheduled.</p>
          <Link href={`/league/${slug}`} className="btn btn-primary">← Back to League</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', marginBottom: '0.5rem' }}>Picks Saved!</h2>
          <p style={{ color: 'var(--slate-mid)' }}>Redirecting back to your league…</p>
        </div>
      </div>
    );
  }

  const shown = filteredGolfers();

  return (
    <div className="page-shell">
      <nav className="nav">
        <div className="nav-inner">
          <Link href={`/league/${slug}`} className="nav-logo">Fairway <span>Fantasy</span></Link>
          <ul className="nav-links">
            <li><Link href={`/league/${slug}`}>← Leaderboard</Link></li>
          </ul>
        </div>
      </nav>

      {/* Tournament header */}
      <div className="t-hero" style={{ padding: '2rem 1.5rem' }}>
        <div className="container">
          {tournament.type === 'major' && <div className="major-badge">🏆 Major Championship</div>}
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, marginBottom: '0.3rem' }}>
            {tournament.name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>
            {deadline
              ? `Pick deadline: ${deadline.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${deadline.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
              : `Starts ${new Date(tournament.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
          </p>
        </div>
      </div>

      <div className="page-content">
        <div className="container" style={{ maxWidth: 900 }}>
          {isLocked && (
            <div className="alert alert-warn" style={{ marginBottom: '1.5rem' }}>
              🔒 Picks are locked — this tournament has already started.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

            {/* Pick slots */}
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Your Foursome
              </h2>
              <p style={{ color: 'var(--slate-mid)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Click a slot to search for a golfer. Slots 1–2 = top tier (OWGR 1–24), Slots 3–4 = dark horses (OWGR 25+).
              </p>

              {errors.length > 0 && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  {errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {selected.map((golfer, i) => {
                  const slot = i as Slot;
                  const isDH = i >= 2;
                  const isActive = activeSlot === slot;

                  return (
                    <div
                      key={i}
                      className={`golfer-slot ${golfer ? 'slot-filled' : ''} ${isDH && golfer ? 'slot-dark-horse' : ''}`}
                      style={{ outline: isActive ? '2px solid var(--green-mid)' : 'none', outlineOffset: 2 }}
                      onClick={() => { if (!isLocked) { setActiveSlot(slot); setSearch(''); } }}
                    >
                      <div className="slot-num">{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        {golfer ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{golfer.name}</div>
                              <div className="slot-meta">
                                <span className={`badge ${isDH ? 'badge-brass' : 'badge-green'}`} style={{ marginRight: '0.4rem', fontSize: '0.62rem' }}>
                                  {isDH ? '🐴 Dark Horse' : '⭐ Top Tier'}
                                </span>
                                {golfer.owgr_rank ? `Ranked #${golfer.owgr_rank}` : 'Unranked'}
                                {golfer.country && ` · ${golfer.country}`}
                              </div>
                            </div>
                            {!isLocked && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={e => { e.stopPropagation(); removeGolfer(slot); }}
                                style={{ color: 'var(--red)', padding: '0.3rem 0.6rem' }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isActive ? 'var(--green-mid)' : 'var(--slate-mid)' }}>
                              {isActive ? '🔍 Searching…' : `Select ${SLOT_LABELS[i]}`}
                            </div>
                            <div className="slot-meta">{SLOT_HELP[i]}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isLocked && (
                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={handleSubmit}
                  disabled={saving || !allSelected}
                >
                  {saving ? 'Saving…' : allSelected ? 'Submit Picks ✓' : 'Select all 4 golfers to submit'}
                </button>
              )}

              <div className="card" style={{ marginTop: '1.5rem', background: 'var(--green-pale)', border: 'none' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green-deep)', marginBottom: '0.5rem' }}>
                  Scoring Rules
                </p>
                <ul style={{ fontSize: '0.82rem', color: 'var(--slate)', lineHeight: 1.8, paddingLeft: '1rem' }}>
                  <li>Top 3 of your 4 golfers count toward your score</li>
                  <li>Missed cut = cut score +1 stroke penalty</li>
                  <li>Made cut = score capped at the cut line</li>
                  <li>Withdrawal = swap with any golfer who hasn't teed off</li>
                  <li>No two players in the league may pick the same exact 4</li>
                </ul>
              </div>
            </div>

            {/* Golfer search panel */}
            {activeSlot !== null && (
              <div style={{ position: 'sticky', top: '80px' }}>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--cream-dark)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        Select {SLOT_LABELS[activeSlot]}
                        <span className={`badge ${activeSlot >= 2 ? 'badge-brass' : 'badge-green'}`} style={{ marginLeft: '0.5rem' }}>
                          {activeSlot >= 2 ? 'Dark Horse' : 'Top Tier'}
                        </span>
                      </p>
                      <button className="btn btn-ghost btn-sm" onClick={() => setActiveSlot(null)}>✕</button>
                    </div>
                    <input
                      className="input"
                      type="text"
                      placeholder="Search players…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="player-list" style={{ maxHeight: 400, border: 'none', borderRadius: 0 }}>
                    {shown.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-mid)', fontSize: '0.875rem' }}>
                        No players found
                      </div>
                    ) : shown.slice(0, 50).map(g => {
                      const isSelected  = selected.some(s => s?.id === g.id);
                      const isTakenByOther = alreadyPicked.includes(g.id);
                      const disabled = isTakenByOther;

                      return (
                        <div
                          key={g.id}
                          className={`player-item ${disabled ? 'disabled' : ''}`}
                          onClick={() => !disabled && selectGolfer(g)}
                          style={{ background: isSelected ? 'var(--green-pale)' : undefined }}
                        >
                          {g.headshot_url ? (
                            <img src={g.headshot_url} alt={g.name} width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cream-dark)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-mid)' }}>
                              {g.name[0]}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="player-name" style={{ color: isSelected ? 'var(--green-deep)' : undefined }}>
                              {g.name}
                              {isSelected && <span style={{ marginLeft: '0.3rem', color: 'var(--green-mid)', fontSize: '0.75rem' }}>✓ Selected</span>}
                            </div>
                            <div className="player-country">
                              {g.country}
                              {isTakenByOther && <span style={{ color: 'var(--red)', marginLeft: '0.3rem' }}>· Taken</span>}
                            </div>
                          </div>
                          <div className="player-rank">
                            {g.owgr_rank ? `#${g.owgr_rank}` : '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeSlot === null && (
              <div className="card" style={{ textAlign: 'center', color: 'var(--slate-mid)', padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👆</div>
                <p style={{ fontSize: '0.875rem' }}>Click a slot on the left to search for a golfer</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
