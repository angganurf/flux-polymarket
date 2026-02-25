# PredictFlow - Project Context

## Overview
PredictFlow is Asia's #1 prediction market analytics platform. Built with Next.js 16, it combines Polymarket real-time data with a local virtual-points prediction system. Features include OAuth authentication, in-app and email notifications, admin dashboard, Telegram/Discord bots, PWA support, and full internationalization (EN/KO).

## Tech Stack
- **Framework**: Next.js 16.1.6 (Turbopack, App Router)
- **Language**: TypeScript 5.9
- **Runtime**: React 19.2
- **Styling**: Tailwind CSS v4 with custom dark theme tokens (`globals.css`)
- **DB**: PostgreSQL 17 (Docker) + Prisma 7 with `@prisma/adapter-pg`
- **Auth**: NextAuth v5 (beta.30), JWT strategy, Credentials + Google + Kakao providers
- **State**: Zustand v5 (WebSocket prices), TanStack Query v5 (server state)
- **i18n**: next-intl v4 (EN/KO)
- **Charts**: TradingView Lightweight Charts v5
- **AI**: Vercel AI SDK v6 + @ai-sdk/openai
- **Email**: Resend v6
- **Testing**: Vitest v4
- **Monitoring**: Vercel Analytics + Speed Insights
- **Icons**: Lucide React
- **Utilities**: date-fns v4, numeral v2, clsx, tailwind-merge, bcryptjs v3

## Dev Server
- **Port**: 3100 (`npm run dev` runs on `--port 3100`)
- Ports 3000, 4000, 5000 are reserved for other projects
- **PostgreSQL**: `docker compose up -d` starts PostgreSQL 17 on port 5432
- **First run**: `docker compose up -d && npm install && npx prisma generate && npm run db:push && npm run db:seed`

## Architecture

### API Proxy Pattern (CORS avoidance)
Browser requests go through Next.js proxy routes to avoid CORS:
- `/api/polymarket/events` -> `gamma-api.polymarket.com/events`
- `/api/polymarket/events/[slug]` -> `gamma-api.polymarket.com/events/slug/{slug}`
- `/api/polymarket/markets` -> `gamma-api.polymarket.com/markets`
- `/api/polymarket/markets/[slug]` -> `gamma-api.polymarket.com/markets/slug/{slug}`
- `/api/polymarket/search` -> `gamma-api.polymarket.com/public-search`
- `/api/polymarket/book` -> `clob.polymarket.com/book`
- `/api/polymarket/prices-history` -> `clob.polymarket.com/prices-history`
- `/api/polymarket/leaderboard` -> `data-api.polymarket.com/leaderboard`

URL routing logic is in `lib/api/fetch-helper.ts` (gammaUrl, clobUrl, dataUrl).

### Key Data Flow
- **Market cards** link using `market.slug` (market-level slug, NOT event slug)
- **Market detail page** fetches via `fetchMarketBySlug()` -> `/markets/slug/{slug}`
- **DO NOT** use `fetchEventBySlug()` for market detail -- event slugs != market slugs

### Gamma API Gotchas
- Sort params use **camelCase**: `volume24hr`, `startDate`, `endDate` (NOT snake_case)
- Search uses `q=` param (NOT `query=`)
- `/events/slug/{slug}` returns events; `/markets/slug/{slug}` returns individual markets

### Internal API Routes
- `/api/auth/[...nextauth]` -- NextAuth endpoints
- `/api/auth/register` -- User registration (credentials)
- `/api/events` -- CRUD for prediction events (GET list, POST create)
- `/api/events/[id]` -- Single event detail
- `/api/events/[id]/resolve` -- Resolve a prediction event
- `/api/events/[id]/comments` -- Comments on events (GET/POST)
- `/api/bets` -- Place bets
- `/api/leaderboard` -- Local PredictFlow leaderboard
- `/api/notifications` -- User notifications (GET/PATCH)
- `/api/user` -- User profile/points
- `/api/ai/analyze` -- Streaming AI market analysis
- `/api/og` -- Dynamic OG image generation (1200x630)
- `/api/cache` -- Cache management (admin)
- `/api/admin/stats` -- Admin dashboard statistics
- `/api/admin/users` -- Admin user management
- `/api/admin/users/[id]` -- Admin user detail/role change
- `/api/admin/events` -- Admin event management
- `/api/admin/system` -- System info and environment status
- `/api/bot/telegram` -- Telegram webhook handler
- `/api/bot/discord` -- Discord interactions handler
- `/api/markets` -- Local markets API

### Caching
In-memory LRU cache (`lib/cache.ts`) with TTL presets:
- Events list: 1 min
- Event detail: 30s
- Search: 2 min
- Leaderboard: 5 min
- Order book: 10s
- Price history: 1 min

### Rate Limiting
In-memory sliding window rate limiter (`lib/rate-limit.ts`) applied to all API routes. Per-IP limits with configurable window and max requests.

### Security Headers
Configured in `next.config.ts`:
- X-Frame-Options: DENY (except `/embed/*` which allows framing)
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=31536000
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Content-Security-Policy with explicit allow-lists for Polymarket domains

## Completed Features

### Phase 1: Polymarket Dashboard
- Home page with trending markets, hero section, stats, "Why PredictFlow" section
- Markets Explorer with category filters, search, sort (volume, liquidity, newest, ending soon)
- Market detail: probability chart, order book, WebSocket live prices
- Polymarket leaderboard with period/category filters

### Phase 2: Auth + Predictions
- NextAuth credentials auth (register/login)
- Virtual points system (1,000 starting points)
- Create prediction events with categories
- Place bets (YES/NO) with points
- Event resolution by creator

### Sprint 3: Growth Features
- **Embed Widget**: `/embed/market/[slug]` -- iframe-embeddable market cards with chart
- **OG Share Cards**: `/api/og` -- dynamic 1200x630 OG images for Twitter/Kakao
- **Share Buttons**: Twitter/X, Kakao, Copy Link on market and prediction pages
- **Portfolio Page**: `/portfolio` -- auth-gated dashboard with bet history, P&L, win rate
- **Comments**: Comment system on prediction events (GET/POST API, threaded UI)
- **AI Analysis**: Streaming GPT market analysis panel (works without API key via fallback)
- **Korean Seed Data**: 8 prediction events (4 Korean, 4 English) via `prisma/seed.ts`

### Sprint 4: Quality
- **i18n**: Full EN/KO localization via next-intl with `[locale]` routing
- **TanStack Query**: Server state management with React Query for all data fetching
- **Security Hardening**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Pagination**: Server-side pagination on markets and events
- **Testing**: Vitest test suite established

### Sprint 5: Infrastructure
- **PostgreSQL Migration**: Moved from SQLite to PostgreSQL 17 with `@prisma/adapter-pg`
- **Docker Compose**: PostgreSQL service with persistent volume
- **Notifications**: In-app notification system with preferences per type
- **Email Notifications**: Resend integration for bet results and comment replies
- **Admin Dashboard**: Stats overview, user management (role changes), event management (force resolve/cancel), cache management, system settings/env status
- **OAuth**: Google and Kakao providers with `NEXT_PUBLIC_OAUTH_*_ENABLED` feature flags
- **Caching**: In-memory LRU cache with TTL presets for all proxy routes
- **PWA**: Service worker (`public/sw.js`), web manifest, install prompt, offline page
- **Bots**: Telegram and Discord bot integrations with webhook handlers and setup scripts
- **Bot Subscribers**: Database model for managing bot subscriptions per platform

### Sprint 6: Production Hardening
- **Email via Resend**: Templated HTML emails for bet results and comment replies
- **CI/CD**: GitHub Actions pipeline (lint, type-check, test with PostgreSQL service, build)
- **Structured Logging**: JSON logger (`lib/logger.ts`) with request timing
- **SEO**: Dynamic sitemap (`app/sitemap.ts`), robots.txt, OG metadata
- **CSP**: Full Content-Security-Policy with Polymarket domain allowlist
- **Dynamic Imports**: Loading skeletons for all route segments
- **Environment Validation**: `lib/validate-env.ts` validates AUTH_SECRET and DATABASE_URL at startup, warns on weak secrets and missing OAuth config
- **139 Tests**: Comprehensive test coverage across 11 test files

### Sprint 7: Polish
- **Rate Limiting**: In-memory rate limiter applied to all API routes
- **Local Leaderboard**: PredictFlow-specific leaderboard tab alongside Polymarket leaderboard
- **Admin Settings**: System info page showing Node/Next.js versions, DB status, configured features, environment variable status
- **Error Boundaries**: Per-route error.tsx components for markets, predict, portfolio, admin, notifications
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
- **Not Found Pages**: Custom 404 pages with locale support

## Database
- **Engine**: PostgreSQL 17 via Docker
- **Adapter**: `@prisma/adapter-pg` (Prisma 7 driver adapter with `pg` client)
- **Connection**: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/predictflow"`
- **Schema**: `prisma/schema.prisma`
- **Generated Client**: `lib/generated/prisma/client`
- **Models**:
  - `User` -- id, name, email, password, points (default 1000), role ("user"|"admin")
  - `Account` -- OAuth account linking (Google, Kakao)
  - `Session` -- Session management
  - `PredictionEvent` -- title, description, category, endDate, status, result, creatorId
  - `Bet` -- userId, eventId, choice ("yes"|"no"), amount, payout
  - `Comment` -- content, userId, eventId (cascade delete on event)
  - `Notification` -- userId, type, title, message, link, read, emailSent
  - `NotificationPreference` -- per-user toggles for inApp, email, betResults, eventResolved, commentReplies, systemAlerts
  - `BotSubscriber` -- platform ("telegram"|"discord"), chatId, active

### Database Scripts
| Command | Action |
|---------|--------|
| `npm run db:push` | Push schema to database (no migration) |
| `npm run db:migrate` | Create and apply migration |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed database (idempotent) |
| `npm run db:studio` | Open Prisma Studio GUI |

## Key Files
| File | Purpose |
|------|---------|
| `lib/api/fetch-helper.ts` | URL routing (server vs browser proxy) |
| `lib/api/gamma.ts` | Gamma API client (events, markets, search) |
| `lib/api/clob.ts` | CLOB API client (prices, order book) |
| `lib/hooks/use-market-detail.ts` | Market detail hooks (useMarketDetail, usePriceHistory) |
| `lib/stores/market-store.ts` | Zustand store for WebSocket prices |
| `lib/auth.ts` | NextAuth config (Credentials + Google + Kakao) |
| `lib/db.ts` | Prisma singleton with PrismaPg adapter |
| `lib/admin.ts` | Admin role verification helper |
| `lib/cache.ts` | In-memory LRU cache with TTL presets |
| `lib/rate-limit.ts` | In-memory sliding window rate limiter |
| `lib/notifications.ts` | Notification creation, preferences, email dispatch |
| `lib/email.ts` | Resend email client and HTML templates |
| `lib/logger.ts` | Structured JSON logging |
| `lib/validate-env.ts` | Startup environment validation |
| `lib/bot/telegram.ts` | Telegram bot command handlers |
| `lib/bot/discord.ts` | Discord bot command handlers |
| `lib/bot/discord-verify.ts` | Discord interaction signature verification |
| `next.config.ts` | Next.js config (images, i18n, security headers, CSP) |
| `i18n/request.ts` | next-intl locale detection |
| `messages/en.json` | English translations |
| `messages/ko.json` | Korean translations |
| `prisma/schema.prisma` | Database schema (9 models) |
| `prisma/seed.ts` | Seed data (8 prediction events) |
| `docker-compose.yml` | PostgreSQL 17 service |
| `.github/workflows/ci.yml` | CI pipeline (lint, type-check, test, build) |
| `vitest.config.ts` | Vitest configuration |
| `app/sitemap.ts` | Dynamic sitemap generation |
| `public/sw.js` | Service worker for PWA |
| `public/manifest.json` | PWA web manifest |
| `components/market-detail/market-detail-view.tsx` | Market detail client component |
| `components/predict/prediction-detail-view.tsx` | Prediction detail client component |

## Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth secret (min 32 chars, generate with `openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | Yes | Set to `true` for non-Vercel deployments |
| `NEXT_PUBLIC_BASE_URL` | Yes | Base URL for OG images, bots, share links (e.g. `http://localhost:3100`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED` | No | Feature flag to show Google login button (`true`/`false`) |
| `KAKAO_CLIENT_ID` | No | Kakao OAuth client ID |
| `KAKAO_CLIENT_SECRET` | No | Kakao OAuth client secret |
| `NEXT_PUBLIC_OAUTH_KAKAO_ENABLED` | No | Feature flag to show Kakao login button (`true`/`false`) |
| `OPENAI_API_KEY` | No | OpenAI API key for AI analysis (graceful fallback without it) |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token from BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | No | Secret for verifying Telegram webhook requests |
| `DISCORD_APP_ID` | No | Discord application ID |
| `DISCORD_BOT_TOKEN` | No | Discord bot token |
| `DISCORD_PUBLIC_KEY` | No | Discord interaction verification key |
| `RESEND_API_KEY` | No | Resend API key for email notifications |
| `EMAIL_FROM` | No | Sender address (default: `PredictFlow <notifications@predictflow.app>`) |

## Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3100 (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run type-check` | TypeScript type checking (`tsc --noEmit`) |
| `npm test` | Run all tests (`vitest run`) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run bot:telegram:setup` | Set up Telegram bot webhook |
| `npm run bot:discord:setup` | Register Discord slash commands |

## Git
- Remote: `https://github.com/jeromwolf/flux-polymarket.git`
- Branch: `main`

## Testing
- **Framework**: Vitest v4 with Node environment
- **Config**: `vitest.config.ts` with `@/` path alias
- **Test files**: 11 files in `lib/__tests__/`:
  - `admin.test.ts` -- Admin role verification
  - `bot-discord.test.ts` -- Discord bot command handling
  - `bot-telegram.test.ts` -- Telegram bot command handling
  - `cache.test.ts` -- LRU cache behavior and TTL
  - `discord-verify.test.ts` -- Discord signature verification
  - `email.test.ts` -- Email sending and templates
  - `format.test.ts` -- Utility formatting functions
  - `notifications.test.ts` -- Notification creation and preferences
  - `proxy-params.test.ts` -- API proxy parameter handling
  - `rate-limit.test.ts` -- Rate limiter behavior
  - `validate-env.test.ts` -- Environment validation
- **Total**: 139 tests
- **CI**: Tests run in GitHub Actions with a PostgreSQL 17 service container

## Known Issues / Remaining Work
- In-memory rate limiter and LRU cache are not suitable for multi-instance deployment (needs Redis for production horizontal scaling)
- Service worker cache version is static (needs build hash injection for proper cache busting)
- Password validation only enforces 6-character minimum (no complexity requirements)

# currentDate
Today's date is 2026-02-26.
