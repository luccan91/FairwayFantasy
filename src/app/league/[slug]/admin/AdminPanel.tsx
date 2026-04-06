'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  league: any;
  members: any[];
  tournaments: any[];
  activeTournament: any | null;
}

export default function AdminPanel({ league, members, tournaments, activeTournament }: Props) {
  const router = useRouter();
  const [syncing, setSyncing]     = useState(false);
  const [syncMsg, setSyncMsg]     = useState('');
  const [removing, setRemoving]   = useState<string | null>(null);
  const [newInvite, setNewInvite] = useState('');

  async function triggerSync() {
    setSyncing(true); setSyncMsg('');
    const res = await fetch('/api/sync-scores', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}` },
    });
    const data = await res.json();
    setSyncing(false);
    setSyncMsg(res.ok ? `✅ Synced: ${JSON.stringify(data.results ?? data.message)}` : `❌ ${data.error}`);
  }

  async function removeMember(userId: string) {
    if (!confirm('Remove this player from the league?')) return;
    setRemoving(userId);
    await fetch(`/api/leagues/members?leagueId=${league.id}&userId=${userId}`, { method: 'DELETE' });
    setRemoving(null);
    router.refresh();
  }

  async function regenerateInvite() {
    const res = await fetch(`/api/leagues/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId: league.id }),
    });
    const data = await res.json();
    if (data.inviteCode) setNewInvite(data.inviteCode);
  }

  const inviteCode = newInvite || league.invite_code;
  const inviteUrl  = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${league.slug}/${inviteCode}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 800 }}>

      {/* Sync scores */}
      <div className="card">
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
          Score Sync
        </h2>
        <p style={{ color: 'var(--slate-mid)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Scores sync automatically every 10 min during tournaments. Trigger manually here if needed.
        </p>
        {activeTournament ? (
          <div>
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              Active: <strong>{activeTournament.name}</strong> · Status: <strong>{activeTournament.status}</strong>
              {activeTournament.cut_score !== null && ` · Cut: ${activeTournament.cut_score > 0 ? '+' : ''}${activeTournament.cut_score}`}
            </div>
            <button className="btn btn-primary" onClick={triggerSync} disabled={syncing}>
              {syncing ? '⏳ Syncing…' : '🔄 Sync Scores Now'}
            </button>
            {syncMsg && <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--slate-mid)' }}>{syncMsg}</p>}
          </div>
        ) : (
          <p style={{ color: 'var(--slate-mid)', fontSize: '0.875rem' }}>No active tournament right now.</p>
        )}
      </div>

      {/* Invite link */}
      <div className="card">
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
          Invite Link
        </h2>
        <p style={{ color: 'var(--slate-mid)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Share this with anyone you want to add to the league.
        </p>
        <div style={{
          background: 'var(--cream)', border: '1px solid var(--cream-dark)',
          borderRadius: 'var(--radius)', padding: '0.75rem 1rem',
          fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all',
          marginBottom: '0.75rem', color: 'var(--green-deep)',
        }}>
          {inviteUrl}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => navigator.clipboard?.writeText(inviteUrl)}>
            📋 Copy Link
          </button>
          <button className="btn btn-outline btn-sm" onClick={regenerateInvite}>
            🔄 Regenerate Code
          </button>
        </div>
        {newInvite && <p className="hint" style={{ marginTop: '0.5rem' }}>New code generated. Old link is now invalid.</p>}
      </div>

      {/* Members */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--cream-dark)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700 }}>
            League Members ({members.length})
          </h2>
        </div>
        <table className="lb-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m: any) => (
              <tr key={m.user_id}>
                <td><strong>{m.profile?.display_name}</strong></td>
                <td style={{ color: 'var(--slate-mid)', fontSize: '0.85rem' }}>{m.profile?.email}</td>
                <td>
                  <span className={`badge ${m.role === 'commissioner' ? 'badge-brass' : 'badge-gray'}`}>
                    {m.role === 'commissioner' ? '★ Commissioner' : 'Member'}
                  </span>
                </td>
                <td style={{ color: 'var(--slate-mid)', fontSize: '0.82rem' }}>
                  {new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td>
                  {m.role !== 'commissioner' && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red)' }}
                      onClick={() => removeMember(m.user_id)}
                      disabled={removing === m.user_id}
                    >
                      {removing === m.user_id ? '…' : 'Remove'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent tournaments */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--cream-dark)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700 }}>
            Tournament Status
          </h2>
        </div>
        <table className="lb-table">
          <thead>
            <tr>
              <th>Tournament</th>
              <th>Type</th>
              <th>Starts</th>
              <th>Status</th>
              <th>Cut</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t: any) => (
              <tr key={t.id}>
                <td><strong style={{ fontSize: '0.875rem' }}>{t.name}</strong></td>
                <td>
                  <span className={`badge ${t.type === 'major' ? 'badge-brass' : 'badge-gray'}`}>
                    {t.type === 'major' ? '🏆 Major' : 'Regular'}
                  </span>
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--slate-mid)' }}>
                  {new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td>
                  <span className={`badge ${
                    t.status === 'active' ? 'badge-live' :
                    t.status === 'complete' ? 'badge-green' :
                    t.status === 'cut_made' ? 'badge-blue' : 'badge-gray'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  {t.cut_score !== null ? `${t.cut_score > 0 ? '+' : ''}${t.cut_score}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
