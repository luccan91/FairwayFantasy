# ⛳ Fairway Fantasy — Complete Setup Guide

Follow these steps exactly and you'll have a live, working site in about 20 minutes.

---

## What You're Building

A multi-tenant golf fantasy platform where:
- Anyone can create a league with a unique URL (e.g. `yourapp.vercel.app/league/the-boys`)
- Players join via invite link
- Picks are submitted before Thursday tee time each week
- Scores sync automatically from ESPN every 10 minutes during tournaments
- World rankings sync weekly from DataGolf (free tier) for dark horse validation

**Total cost: $0/month**

---

## Prerequisites

You need:
- A free [GitHub](https://github.com) account
- A free [Vercel](https://vercel.com) account
- A free [Supabase](https://supabase.com) account
- A free [DataGolf](https://datagolf.com) account (for OWGR rankings)
- [Node.js 18+](https://nodejs.org) installed locally

---

## Step 1 — Set Up Your Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
   - Give it a name like "fairway-fantasy"
   - Choose a strong database password and save it somewhere safe
   - Pick the region closest to you
   - Wait ~2 minutes for provisioning

2. Once your project is ready, click **SQL Editor** in the left sidebar

3. Click **New Query**, paste the entire contents of `supabase/schema.sql`, and click **Run**
   - You should see "Success. No rows returned"
   - This creates all your tables, indexes, and security policies

4. Go to **Settings → API** and copy these three values — you'll need them later:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (another long string — keep this secret!)

5. In Supabase, go to **Authentication → URL Configuration** and set:
   - Site URL: `https://your-app.vercel.app` (you'll get this URL in Step 4 — come back)
   - Redirect URLs: add `https://your-app.vercel.app/auth/callback`

---

## Step 2 — Deploy to Vercel

### Option A: Deploy via GitHub (recommended)

1. Push this project to a new GitHub repo:
   ```bash
   cd golf-fantasy-complete
   git init
   git add .
   git commit -m "Initial commit"
   # Create a new repo at github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/fairway-fantasy.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Vercel will detect it's a Next.js project automatically
5. **Before clicking Deploy**, click **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
   | `CRON_SECRET` | Any random string (go to generate-secret.vercel.app/32) |
   | `NEXT_PUBLIC_SITE_URL` | Leave blank for now — add after first deploy |

6. Click **Deploy** — wait ~2 minutes

7. Once deployed, copy your Vercel URL (e.g. `https://fairway-fantasy-xyz.vercel.app`)
   - Go back to Vercel → Settings → Environment Variables
   - Add `NEXT_PUBLIC_SITE_URL` = your Vercel URL
   - Go back to Supabase → Auth → URL Configuration and update with your real URL
   - Redeploy: Vercel Dashboard → Deployments → click the three dots → Redeploy

### Option B: Deploy via Vercel CLI

```bash
npm install -g vercel
cd golf-fantasy-complete
npm install
vercel
# Follow prompts, add env vars when asked
vercel --prod
```

---

## Step 4 — Seed Initial Tournament Data

The ESPN schedule sync runs automatically every Monday at 6am via cron. To seed it immediately after deploy:

1. In your browser, go to:
   ```
   https://your-app.vercel.app/api/sync-scores/rankings
   ```
   With the header `Authorization: Bearer YOUR_CRON_SECRET`

   Or easier — use curl:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-app.vercel.app/api/sync-scores/rankings
   ```

2. This fetches the full PGA Tour schedule from ESPN and all OWGR rankings from DataGolf
3. You should see a JSON response with `{ "success": true, "tournaments": 40+, "rankings": {...} }`

---

## Step 5 — Create Your First League

1. Go to your deployed site URL
2. Click **Get Started** → create an account with your email
3. Verify your email (check inbox for Supabase confirmation)
4. Click **Create a League**
5. Enter a league name and URL slug (e.g. `the-boys`)
6. You'll land on your league dashboard — copy the invite link
7. Share it with your friends!

---

## Step 6 — (Optional) Custom Domain

1. Buy a domain anywhere (Namecheap, Google Domains, etc.)
2. In Vercel → your project → Settings → Domains
3. Add your domain and follow the DNS instructions
4. Update `NEXT_PUBLIC_SITE_URL` and Supabase redirect URLs with your new domain
5. Redeploy

---

## How Cron Jobs Work

Vercel runs two automatic jobs defined in `vercel.json`:

| Job | Schedule | What it does |
|---|---|---|
| `/api/sync-scores` | Every 10 min | Fetches live ESPN leaderboard, applies rules, updates fantasy scores |
| `/api/sync-scores/rankings` | Monday 6am | Syncs OWGR rankings + PGA Tour schedule from ESPN |

These run automatically once deployed — no action needed.

> **During active tournaments** (Thu–Sun), the sync runs every 10 minutes.
> The rest of the week it runs but finds no active tournaments and exits quickly.

---

## Adding Players to the Field

Golfer data populates automatically:
- **Tournament field**: when the score sync runs and finds competitors, it auto-inserts any unknown golfers
- **OWGR ranks**: updated weekly by the rankings cron from DataGolf

If golfers are missing before a tournament (e.g. picks page shows empty), manually trigger the rankings sync:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/sync-scores/rankings
```

---

## Multi-League Management

Each group gets their own league URL. As commissioner, you can:
- Share invite links from the Admin panel
- Regenerate invite codes if needed (invalidates old links)
- Remove members
- Manually trigger score sync
- See all tournament statuses

Players can be in multiple leagues simultaneously — they'll see all their leagues on the dashboard.

---

## Troubleshooting

**"Invalid invite link"** — The invite code is case-sensitive. Make sure the URL copied correctly.

**Picks page shows no golfers** — Run the rankings sync manually (see Step 4).

**Scores not updating** — Check Vercel Logs → Functions for errors. Most common cause: Supabase service role key is missing or wrong.

**Auth email not arriving** — Check spam. In Supabase → Auth → Email Templates you can customize the sender.

**Database errors** — Go to Supabase → Database → Logs for detailed error messages.

---

## File Structure Reference

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/page.tsx          # "My Leagues" dashboard
│   ├── create/page.tsx             # Create league form
│   ├── auth/
│   │   ├── signin/page.tsx         # Sign in
│   │   ├── signup/page.tsx         # Sign up
│   │   └── callback/route.ts       # Auth redirect handler
│   ├── join/[slug]/[code]/page.tsx # Join league via invite
│   ├── league/[slug]/
│   │   ├── page.tsx                # League leaderboard
│   │   ├── picks/page.tsx          # Pick submission
│   │   ├── history/page.tsx        # Past tournaments
│   │   └── admin/                  # Commissioner tools
│   └── api/
│       ├── leagues/                # CRUD + join + invite
│       ├── picks/                  # Submit + replace
│       ├── sync-scores/            # ESPN sync + rankings
│       └── players/                # Golfer list
├── components/layout/Nav.tsx       # Shared navigation
├── lib/
│   ├── espn.ts                     # ESPN API client
│   ├── scoring.ts                  # Rules engine
│   ├── supabase.ts                 # DB client + helpers
│   └── datagolf.ts                 # Rankings client
└── types/index.ts                  # TypeScript types

supabase/schema.sql                 # Full database schema
vercel.json                         # Cron job config
.env.example                        # Environment variable template
```
