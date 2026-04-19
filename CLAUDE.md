# The Cellar — Wine Collection Manager

Next.js 14 App Router · TypeScript · Tailwind CSS 4 · Supabase · Anthropic API

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in credentials
2. Run the SQL in `supabase-schema.sql` against your Supabase project
3. Seed the database: `npx tsx scripts/seed.ts` (requires `WineData.csv` in project root)
4. `npm run dev`

## Environment Variables

| Variable | Where to get |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API (secret) |
| `ANTHROPIC_API_KEY` | console.anthropic.com |

## Deploy

Push to GitHub → connect repo in Vercel → add env vars in Vercel dashboard → deploy.

## Routes

| Route | Purpose |
|---|---|
| `/` | Cellar view — all owned wines |
| `/wine/[id]` | Wine detail + inline editing |
| `/add` | Add wine (manual or camera scan) |
| `/wishlist` | Wishlist |
| `/sommelier` | AI chat |
| `/stats` | Charts & statistics |

## AI Models
Uses `claude-sonnet-4-20250514` for lookup, scan, and chat.
