# ⛳ Golf Fantasy — Multi-Tenant Platform

A free, self-hosted golf fantasy competition platform supporting multiple leagues,
PGA Tour events, all four Majors, live ESPN scoring, and your custom rules.

---

## Features

- **Multi-tenant** — unlimited leagues, each with their own invite code & URL
- **Live scoring** via ESPN's undocumented public API (free, no key needed)
- **OWGR rankings** via DataGolf free tier (for dark horse validation)
- **Custom rules engine**: top-3 scoring, cut rules, withdrawal replacements
- **Pick locking** — auto-locks Thursday before first tee time
- **Commissioner controls** — manual overrides, player management

---

## Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Framework | Next.js 14 (App Router) | Free |
| Database + Auth | Supabase | Free tier |
| Hosting + Cron | Vercel | Free tier |
| Live Scores | ESPN hidden API | Free |
| World Rankings | DataGolf API | Free tier |

**Total monthly cost: $0**

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd golf-fantasy
npm install
```

### 2. Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key

### 3. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATAGOLF_API_KEY=your-datagolf-key
CRON_SECRET=any-random-string-you-choose
```

> DataGolf free tier key: sign up at datagolf.com — free tier covers rankings endpoint

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Add all env variables in Vercel dashboard → Settings → Environment Variables.

The `vercel.json` cron config will automatically start syncing scores every 10 minutes
during tournament rounds.

---

## Creating a New League

1. Visit `yourdomain.com/create`
2. Name your league, set a slug (e.g. `the-boys`)
3. Share the invite link: `yourdomain.com/join/the-boys/INVITE_CODE`
4. Players sign up and are auto-added to your league

League URL: `yourdomain.com/league/the-boys`

---

## Scoring Rules (Implemented)

1. **Pick 4 golfers** — 2 top tier (ranked 1–24), 2 dark horses (ranked 25+)
2. **No two players in a league may pick the same 4** — validated at submission
3. **Only top 3 of your 4 golfers count** toward final score
4. **Missed cut** → golfer's score = cut score + 1 stroke
5. **Made cut** → golfer's final score is capped at the cut score (can't go worse)
6. **Withdrawal** → replacement allowed with any golfer who hasn't teed off yet

---

## Project Structure

```
golf-fantasy/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── sync-scores/     # ESPN score sync (called by cron)
│   │   │   ├── leagues/         # League CRUD
│   │   │   ├── picks/           # Pick submission + validation
│   │   │   └── players/         # Player list + OWGR rankings
│   │   ├── league/[slug]/       # League home, tournament views
│   │   └── auth/                # Sign in / sign up
│   ├── components/
│   │   ├── ui/                  # Buttons, cards, inputs
│   │   └── layout/              # Nav, shell
│   ├── lib/
│   │   ├── espn.ts              # ESPN API client
│   │   ├── scoring.ts           # Custom rules engine
│   │   ├── supabase.ts          # DB client
│   │   └── datagolf.ts          # Rankings client
│   └── types/
│       └── index.ts             # Shared TypeScript types
├── supabase/
│   └── schema.sql               # Full DB schema — run this first
└── vercel.json                  # Cron job config
```
