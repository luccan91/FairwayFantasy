'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateLeaguePage() {
  const router = useRouter();
  const [name, setName]           = useState('');
  const [slug, setSlug]           = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setName(v);
    if (!slugEdited) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
    router.push(`/league/${slug}`);
  }

  return (
    <div className="page-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <nav className="nav">
          <div className="nav-inner">
            <Link href="/dashboard" className="nav-logo">Fairway <span>Fantasy</span></Link>
          </div>
        </nav>
      </div>

      <div className="container-sm" style={{ paddingTop: '6rem', paddingBottom: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏆</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, marginBottom: '0.4rem' }}>
            Create a League
          </h1>
          <p style={{ color: 'var(--slate-mid)' }}>Give it a name and a URL — you're the commissioner.</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label className="label">League Name</label>
              <input className="input" type="text" required placeholder="The Boys Golf Club"
                value={name} onChange={onNameChange} maxLength={60} />
            </div>

            <div className="field">
              <label className="label">League URL</label>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: '2px solid var(--cream-dark)', borderRadius: 'var(--radius)',
                overflow: 'hidden', background: 'white', transition: 'border-color 0.15s',
              }}>
                <span style={{ padding: '0.75rem 0.9rem', color: 'var(--slate-mid)', fontSize: '0.82rem', background: 'var(--cream)', borderRight: '1px solid var(--cream-dark)', whiteSpace: 'nowrap' }}>
                  fairway.app/league/
                </span>
                <input
                  style={{ flex: 1, padding: '0.75rem 0.9rem', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 600 }}
                  type="text" placeholder="the-boys"
                  value={slug}
                  onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)); setSlugEdited(true); }}
                />
              </div>
              <p className="hint">Lowercase letters, numbers, hyphens only.</p>
            </div>

            <div className="alert alert-info" style={{ marginTop: '0.5rem' }}>
              💡 After creating your league, you'll get an invite link to share with your group.
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg"
              disabled={loading || !name || slug.length < 2} style={{ marginTop: '1rem' }}>
              {loading ? 'Creating…' : 'Create League →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--slate-mid)', fontSize: '0.875rem', marginTop: '1.25rem' }}>
          <Link href="/dashboard" style={{ color: 'var(--green-mid)', fontWeight: 600, textDecoration: 'none' }}>← Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}
