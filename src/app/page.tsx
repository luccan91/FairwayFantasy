import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Fairway Fantasy — Golf Leagues for Your Group' };

export default function HomePage() {
  const rules = [
    { icon: '🏌️', title: 'Pick 4 Golfers', desc: '2 top-tier (OWGR 1–24) and 2 dark horses (ranked 25+) before Thursday tee time.' },
    { icon: '🤝', title: 'No Copycats', desc: 'No two players in a league may pick the identical foursome. Make it yours.' },
    { icon: '🥇', title: 'Top 3 Count', desc: 'Only your best 3 of 4 golfers count toward your weekly score.' },
    { icon: '✂️', title: 'Cut Rules', desc: 'Missed cut = cut score +1. Made cut = final score capped at the cut line.' },
    { icon: '🔄', title: 'Withdrawals', desc: "If your golfer WDs, swap in anyone who hasn't teed off yet." },
    { icon: '🏆', title: 'Season Long', desc: 'Scores accumulate across all PGA Tour events and the four Majors.' },
  ];

  return (
    <div className="page-shell">
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">Fairway <span>Fantasy</span></a>
          <div className="nav-actions">
            <Link href="/auth/signin" className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Sign In</Link>
            <Link href="/auth/signup" className="btn btn-brass btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(155deg, #1a2f1e 0%, #2d5a34 55%, #3a7040 100%)',
        color: 'white', padding: 'clamp(4rem,10vw,8rem) 1.5rem',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(ellipse at 25% 60%, rgba(184,146,74,0.15) 0%, transparent 55%), radial-gradient(ellipse at 75% 30%, rgba(74,140,84,0.12) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(184,146,74,0.18)',
            border: '1px solid rgba(184,146,74,0.45)', borderRadius: 20,
            padding: '0.3rem 1.1rem', fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d4b06a', marginBottom: '1.75rem',
          }}>
            ⛳ Free · Private · No Ads
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 900,
            lineHeight: 1.0, marginBottom: '1.5rem', letterSpacing: '-0.02em',
          }}>
            Pick Your<br /><span style={{ color: '#d4b06a' }}>Foursome.</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.72)', marginBottom: '2.75rem', lineHeight: 1.75, maxWidth: 520, margin: '0 auto 2.75rem' }}>
            Private golf fantasy leagues for you and your crew. Pick 4 golfers every week, top 3 count. Majors, regular events — the whole season.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/signup" className="btn btn-brass btn-lg">
              Create a League →
            </Link>
            <Link href="/auth/signin" className="btn btn-outline-white btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Rules */}
      <section style={{ padding: 'clamp(3rem,8vw,6rem) 1.5rem', background: 'white' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,4vw,2.5rem)', marginBottom: '0.5rem' }}>
              Simple Rules. Real Stakes.
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem' }}>Everything you need to know in 30 seconds.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '1.25rem' }}>
            {rules.map(r => (
              <div key={r.title} className="card card-hover" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '0.85rem' }}>{r.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', marginBottom: '0.5rem' }}>{r.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.65 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to start */}
      <section style={{ padding: 'clamp(3rem,8vw,5rem) 1.5rem', background: 'var(--cream)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,4vw,2.2rem)', textAlign: 'center', marginBottom: '2.5rem' }}>
            Up and running in 3 minutes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { n: '1', t: 'Create your league', d: 'Pick a name and URL slug. You\'re the commissioner.' },
              { n: '2', t: 'Share the invite link', d: 'Send one link — friends click it, create an account, and they\'re in.' },
              { n: '3', t: 'Submit picks by Thursday', d: '2 top-tier golfers, 2 dark horses. Picks lock before the first tee shot.' },
              { n: '4', t: 'Watch the leaderboard update live', d: 'Scores sync from ESPN every 10 minutes, Thursday through Sunday.' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--green-deep)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 900,
                  flexShrink: 0,
                }}>{step.n}</div>
                <div style={{ paddingTop: '0.5rem' }}>
                  <strong style={{ fontWeight: 700 }}>{step.t}</strong>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.15rem' }}>{step.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/auth/signup" className="btn btn-primary btn-lg">Start Your League →</Link>
          </div>
        </div>
      </section>

      <footer style={{ background: 'var(--green-deep)', color: 'rgba(255,255,255,0.45)', padding: '2rem 1.5rem', textAlign: 'center', fontSize: '0.82rem' }}>
        <p>Fairway Fantasy · Free forever · Built for golf groups</p>
        <p style={{ marginTop: '0.4rem' }}>Scores powered by ESPN public data. Not affiliated with PGA Tour or ESPN.</p>
      </footer>
    </div>
  );
}
