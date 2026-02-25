# PredictFlow - Project Context

## Overview
PredictFlow is a prediction market analytics platform aiming to become Asia's #1 prediction market. Built with Next.js 16, it combines Polymarket real-time data with a local virtual-points prediction system.

## Tech Stack
- **Framework**: Next.js 16.1.6 (Turbopack, App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS v4 with custom dark theme tokens (globals.css)
- **DB**: Prisma 7 + PostgreSQL (Docker)
- **Auth**: NextAuth v5 (beta.30), JWT strategy, credentials provider
- **State**: Zustand v5 (WebSocket prices), TanStack Query v5 (server state)
- **i18n**: next-intl v4 (EN/KO)
- **Charts**: TradingView Lightweight Charts v5
- **AI**: Vercel AI SDK v6 + @ai-sdk/openai

## Dev Server
- **Port**: 3100 (`npm run dev` runs on `--port 3100`)
- Ports 3000, 4000, 5000 are reserved for other projects

## Architecture

### API Proxy Pattern (CORS avoidance)
Browser requests go through Next.js proxy routes to avoid CORS:
- `/api/polymarket/events` → `gamma-api.polymarket.com/events`
- `/api/polymarket/events/[slug]` → `gamma-api.polymarket.com/events/slug/{slug}`
- `/api/polymarket/markets` → `gamma-api.polymarket.com/markets`
- `/api/polymarket/markets/[slug]` → `gamma-api.polymarket.com/markets/slug/{slug}`
- `/api/polymarket/search` → `gamma-api.polymarket.com/public-search`
- `/api/polymarket/book` → `clob.polymarket.com/book`
- `/api/polymarket/prices-history` → `clob.polymarket.com/prices-history`
- `/api/polymarket/leaderboard` → `data-api.polymarket.com/leaderboard`

URL routing logic is in `lib/api/fetch-helper.ts` (gammaUrl, clobUrl, dataUrl).

### Key Data Flow
- **Market cards** link using `market.slug` (market-level slug, NOT event slug)
- **Market detail page** fetches via `fetchMarketBySlug()` → `/markets/slug/{slug}`
- **DO NOT** use `fetchEventBySlug()` for market detail — event slugs ≠ market slugs

### Gamma API Gotchas
- Sort params use **camelCase**: `volume24hr`, `startDate`, `endDate` (NOT snake_case)
- Search uses `q=` param (NOT `query=`)
- `/events/slug/{slug}` returns events; `/markets/slug/{slug}` returns individual markets

## Completed Features

### Phase 1: Polymarket Dashboard
- Home page with trending markets, stats
- Markets Explorer with filters, search, sort
- Market detail: probability chart, order book, WebSocket live prices
- Leaderboard

### Phase 2: Auth + Predictions
- NextAuth credentials auth (register/login)
- Virtual points system (1,000 starting points)
- Create prediction events, place bets (YES/NO)
- Event resolution by creator

### Sprint 3: Growth Features
- **Embed Widget**: `/embed/market/[slug]` — iframe-embeddable market cards with chart
- **OG Share Cards**: `/api/og` — dynamic 1200x630 OG images for Twitter/Kakao
- **Share Buttons**: Twitter/X, Kakao, Copy Link on market & prediction pages
- **Portfolio Page**: `/portfolio` — auth-gated dashboard with bet history, P&L, win rate
- **Comments**: Comment system on prediction events (GET/POST API, threaded UI)
- **AI Analysis**: Streaming GPT market analysis panel (works without API key via fallback)
- **Korean Seed Data**: 8 prediction events (4 Korean, 4 English) via `prisma/seed.ts`

## Database
- **Engine**: PostgreSQL 17 via Docker
- **Setup**: `docker compose up -d` to start PostgreSQL, then `npm run db:push` and `npm run db:seed`
- **Connection**: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/predictflow"`
- Schema: `prisma/schema.prisma`
- Models: User, Account, Session, PredictionEvent, Bet, Comment
- Seed: `npm run db:seed` (idempotent)
- Push schema: `npm run db:push`
- Migrate: `npm run db:migrate`
- Generate client: `npm run db:generate`
- Studio: `npm run db:studio`

## Key Files
| File | Purpose |
|------|---------|
| `lib/api/fetch-helper.ts` | URL routing (server vs browser proxy) |
| `lib/api/gamma.ts` | Gamma API client (events, markets, search) |
| `lib/api/clob.ts` | CLOB API client (prices, order book) |
| `lib/hooks/use-market-detail.ts` | Market detail hooks (useMarketDetail, usePriceHistory) |
| `lib/stores/market-store.ts` | Zustand store for WebSocket prices |
| `lib/auth.ts` | NextAuth config |
| `lib/db.ts` | Prisma singleton |
| `next.config.ts` | Next.js config (images, i18n, iframe headers) |
| `components/market-detail/market-detail-view.tsx` | Market detail client component |
| `components/predict/prediction-detail-view.tsx` | Prediction detail client component |

## Git
- Remote: `https://github.com/jeromwolf/flux-polymarket.git`
- Branch: `main`
- Latest commits:
  - `4571665` — Sprint 3 features (embed, OG, portfolio, comments, AI)
  - `9a7b0df` — fix proxy URL mismatches
  - `8c18e54` — fix Gamma API sort params
  - `dd42ce0` — auth + prediction + betting system

## Known Issues / TODO
- Embed widget test used wrong slug in capture script (should use a real market slug like `us-strikes-iran-by-february-5-2026`)
- Sprint 3 market detail bug fix (event slug → market slug) needs to be committed
- AI Analysis requires `OPENAI_API_KEY` in `.env` for full functionality (graceful fallback without key)

## Next Sprint Candidates
1. Notification System (in-app + email)
2. Admin Dashboard
3. Leaderboard Enhancement (local predictions)
4. Mobile PWA
5. Telegram/Discord Bot
6. API Rate Limiting + Caching
7. OAuth (Google/Kakao)
8. Landing Page + SEO
