# PredictFlow — Vercel Deployment Guide

## Prerequisites

- Node.js 18+ (recommended: 20)
- Vercel account (https://vercel.com)
- PostgreSQL database (Vercel Postgres, Supabase, Neon, or AWS RDS)
- Git repository pushed to GitHub

## Step 1: Database Setup

### Option A: Vercel Postgres (Recommended)
1. Go to Vercel Dashboard > Storage > Create Database > Postgres
2. Select region: Seoul (icn1) for lowest latency in Asia
3. Click Create and wait for provisioning
4. Copy the `POSTGRES_URL` — this is your `DATABASE_URL`

### Option B: Supabase
1. Create project at https://supabase.com
2. Go to Settings > Database > Connection String (URI)
3. Use the PostgreSQL connection string (not the Prisma one yet)
4. Copy the URI — this is your `DATABASE_URL`

### Option C: Neon
1. Create project at https://neon.tech
2. Copy the connection string from dashboard (PostgreSQL URI format)
3. This becomes your `DATABASE_URL`

### Option D: AWS RDS
1. Create a PostgreSQL database in RDS
2. Copy the connection string from RDS console
3. Format: `postgresql://user:password@host:5432/dbname?sslmode=require`
4. This becomes your `DATABASE_URL`

## Step 2: Environment Variables

### Required (app will not start without these)

| Variable | How to Generate | Example |
|----------|----------------|---------|
| `DATABASE_URL` | From Step 1 | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `AUTH_SECRET` | Run: `openssl rand -base64 32` | (32-char Base64 string) |

### Recommended

| Variable | Value | Why |
|----------|-------|-----|
| `NEXT_PUBLIC_BASE_URL` | Your production URL | e.g., `https://predictflow.app` |
| `AUTH_URL` | Same as NEXT_PUBLIC_BASE_URL | Vercel auto-sets `VERCEL_URL`, but NextAuth needs explicit URL |
| `AUTH_TRUST_HOST` | `true` | Required for production Auth |

### Optional — OAuth (Google)

To enable Google login:

1. Go to Google Cloud Console (console.cloud.google.com)
2. Create or select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
6. Copy Client ID and Client Secret

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | From credentials |
| `GOOGLE_CLIENT_SECRET` | From credentials |
| `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED` | `true` |

### Optional — OAuth (Kakao)

To enable Kakao login:

1. Go to Kakao Developers (https://developers.kakao.com)
2. Create or select an app
3. Go to App Settings > App Keys
4. Copy REST API Key (Client ID)
5. Go to Security > Client Secret and generate/copy it
6. Add redirect URI in Settings: `https://your-domain.com/api/auth/callback/kakao`

| Variable | Value |
|----------|-------|
| `KAKAO_CLIENT_ID` | REST API Key from App Keys |
| `KAKAO_CLIENT_SECRET` | From Security section |
| `NEXT_PUBLIC_OAUTH_KAKAO_ENABLED` | `true` |

### Optional — Services

These services are optional. The app has graceful fallbacks.

| Variable | Source | Purpose | Fallback |
|----------|--------|---------|----------|
| `OPENAI_API_KEY` | platform.openai.com | AI market analysis | Generic analysis without API |
| `RESEND_API_KEY` | resend.com | Email notifications | Notifications disabled |
| `EMAIL_FROM` | Your domain | Sender email address | Uses default |
| `TELEGRAM_BOT_TOKEN` | @BotFather on Telegram | Telegram bot integration | Bot disabled |
| `TELEGRAM_WEBHOOK_SECRET` | Generate: `openssl rand -hex 20` | Webhook security | Required if using Telegram |
| `DISCORD_APP_ID` | discord.com/developers | Discord bot integration | Bot disabled |
| `DISCORD_BOT_TOKEN` | discord.com/developers | Discord bot token | Bot disabled |
| `DISCORD_PUBLIC_KEY` | discord.com/developers | Webhook verification | Bot disabled |

## Step 3: Deploy to Vercel

### Via Vercel Dashboard (Recommended for First Deploy)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework Preset: **Next.js** (auto-detected)
4. In "Environment Variables" section, add all required variables from Step 2:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_BASE_URL`
   - `AUTH_URL`
   - `AUTH_TRUST_HOST`
   - (and any optional OAuth/service variables)
5. Click **Deploy**
6. Wait for build to complete (usually 2-3 minutes)

### Via Vercel CLI (For Subsequent Deploys)

```bash
npm i -g vercel
vercel login
vercel --prod
```

The CLI will prompt you to add environment variables if they're missing. Copy values from your Vercel Dashboard.

## Step 4: Initialize Database

After the first successful deployment, the app will start but won't have data yet. Run these commands:

```bash
# Option 1: Pull env vars from Vercel and run locally
vercel env pull .env.local
npx prisma db push

# Option 2: Use Vercel CLI to run commands in serverless environment
vercel exec "npx prisma db push"
vercel exec "npm run db:seed"
```

Or access the Vercel Functions logs panel and wait for automatic migrations to run on first request.

### Optional: Seed Demo Data

To populate the database with 8 sample prediction events (4 Korean, 4 English):

```bash
vercel exec "npm run db:seed"
```

This is optional — the app works fine without seed data.

## Step 5: Post-Deploy Verification

### Verification Checklist

After deployment completes, verify these features work:

**Core Pages:**
- [ ] Home page loads (`https://your-domain.com/`)
- [ ] Markets page loads (`https://your-domain.com/en/markets`)
- [ ] Korean locale works (`https://your-domain.com/ko/markets`)

**Authentication:**
- [ ] Registration works (`/en/register`)
- [ ] Credentials login works (`/en/login`)
- [ ] New users receive 1,000 points
- [ ] Portfolio is protected (`/en/portfolio` redirects to login when signed out)
- [ ] Admin dashboard is protected (`/en/admin` returns 403 to non-admins)

**OAuth (if enabled):**
- [ ] Google login works
- [ ] Kakao login works
- [ ] New OAuth users receive 1,000 points

**Market Features:**
- [ ] Market detail page loads (`/en/markets/[slug]`)
- [ ] WebSocket prices update in real-time on market detail
- [ ] Order book loads

**Content Features:**
- [ ] OG image generates (`/api/og?title=Test`)
- [ ] Embed widget loads (`/embed/market/[slug]`)
- [ ] Share buttons appear on market pages

**PWA (Progressive Web App):**
- [ ] Manifest loads (`/manifest.json`)
- [ ] App can be installed on mobile

### Quick Health Check

Run this curl command to check if the API is responding:

```bash
curl https://your-domain.com/api/health
# Should return: { "status": "ok" }
```

Check the Vercel Dashboard > Functions > Logs for any runtime errors.

## Configuration Details

### Region Selection

The `vercel.json` file specifies region `icn1` (Seoul) for Asia-Pacific lowest latency:

```json
{
  "regions": ["icn1"]
}
```

To change region, edit `vercel.json` and redeploy. Common regions:
- `icn1` - Seoul (Asia)
- `nrt1` - Tokyo (Asia)
- `sin1` - Singapore (Asia)
- `sfo1` - San Francisco (North America)
- `lhr1` - London (Europe)
- `cdg1` - Paris (Europe)

### Security Headers

Security headers are automatically applied via `next.config.ts`:

| Header | Effect |
|--------|--------|
| Content-Security-Policy | Restricts scripts, stylesheets, and connections to trusted sources |
| X-Frame-Options: DENY | Prevents clickjacking (except `/embed/*` routes) |
| X-Content-Type-Options: nosniff | Prevents MIME sniffing |
| Strict-Transport-Security | Forces HTTPS for 1 year |
| Referrer-Policy | Hides referrer info from third parties |
| Permissions-Policy | Disables camera, microphone, geolocation |

Embed routes (`/embed/*`) override X-Frame-Options to allow `ALLOWALL` for iframe embedding.

### API Caching

Polymarket proxy routes are cached by Vercel with:
- **Cache-Control**: `s-maxage=30, stale-while-revalidate=60`
- This means: cache for 30s on CDN, serve stale for 60s if origin is down
- Internal routes use per-instance LRU cache with 10s–5min TTLs

## Embed Widget

The embed widget allows any website to embed PredictFlow market cards via iframe.

### Embed URL Format
```
https://your-domain.com/embed/market/{market-slug}
```

### HTML to Embed
```html
<iframe
  src="https://predictflow.app/embed/market/us-election-2028"
  width="400"
  height="600"
  frameborder="0"
  allow="clipboard-write"
></iframe>
```

### Features in Embed
- Live price chart
- Probability display
- Order book (read-only)
- Share buttons
- Responsive design

## Bot Setup (Optional)

If you want to enable Telegram or Discord bot integrations, set up webhooks after deploying.

### Telegram Bot

1. Message @BotFather on Telegram: `/newbot`
2. Follow prompts to create your bot
3. Copy the token (format: `123456789:ABCdefGHIjklmnoPQRstuvWXYZ`)
4. Set in Vercel: `TELEGRAM_BOT_TOKEN`
5. Generate webhook secret: `openssl rand -hex 20`
6. Set in Vercel: `TELEGRAM_WEBHOOK_SECRET`
7. Register the webhook:
   ```bash
   vercel env pull .env.local
   npm run bot:telegram:setup
   ```

The bot will now respond to Telegram commands to view markets and predictions.

### Discord Bot

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Copy the Application ID (Client ID) → set as `DISCORD_APP_ID`
4. Go to Bot > Create a bot
5. Copy the token → set as `DISCORD_BOT_TOKEN`
6. Go to Settings > Public Key and copy it → set as `DISCORD_PUBLIC_KEY`
7. In OAuth2 > URL Generator, select scopes: `bot`, `applications.commands`
8. Register the commands:
   ```bash
   vercel env pull .env.local
   npm run bot:discord:setup
   ```
9. Set the Interactions Endpoint URL in Discord Developer Portal:
   ```
   https://your-domain.com/api/bot/discord
   ```
10. Install the bot to your server using the OAuth2 URL from step 7

## CI/CD Pipeline

The project includes GitHub Actions that run on every push to `main`:

1. **Lint & Type Check**: ESLint + TypeScript compiler
2. **Tests**: Vitest runs with PostgreSQL service container
3. **Build Verification**: Next.js build succeeds

Vercel auto-deploys on push if GitHub integration is active.

### Preview Deployments

Every pull request creates a preview deployment with a unique URL (e.g., `predictflow-pr-42.vercel.app`).

**Important**: Preview deployments use a dummy `DATABASE_URL` during build. To test database features in preview:
- Go to Vercel Dashboard > Settings > Environment Variables
- Set `NEXT_PUBLIC_PREVIEW` or create a preview-only database connection
- Alternatively, run integration tests locally before pushing

## Monitoring & Logging

### Built-in Monitoring

These are automatically enabled:

| Tool | Purpose | Dashboard |
|------|---------|-----------|
| **Vercel Analytics** | User engagement, page views, interactions | Vercel Dashboard > Monitoring |
| **Vercel Speed Insights** | Page load times, Core Web Vitals | Vercel Dashboard > Speed Insights |
| **Structured Logging** | JSON logs from functions | Vercel Dashboard > Functions > Logs |

### View Logs

In Vercel Dashboard:
1. Go to **Functions** tab
2. Select a function (e.g., `api/auth/callback/[...nextauth]`)
3. Scroll to **Logs** section — see real-time requests and errors

### Recommended Additions

For production, consider adding:
- **Error Tracking**: Sentry, Rollbar, or LogRocket
- **Performance Monitoring**: Datadog, New Relic, or Grafana Cloud
- **Uptime Monitoring**: Pingdom, UptimeRobot, or Vercel Alerts

To set up Vercel Alerts:
1. Vercel Dashboard > Settings > Alerts
2. Add alert for error rate, build failures, and function timeout

## Troubleshooting

### Build fails: "Prisma could not connect to database"

**Cause**: `DATABASE_URL` not set during build

**Fix**:
1. Check Vercel Environment Variables for `DATABASE_URL`
2. Ensure the URL is in Prisma format: `postgresql://...`
3. Redeploy: `vercel --prod`

### OAuth login redirects to wrong domain

**Cause**: `AUTH_URL` mismatch

**Fix**:
1. Set `AUTH_URL=https://your-domain.com` in Vercel
2. Set `NEXT_PUBLIC_BASE_URL=https://your-domain.com` in Vercel
3. Set `AUTH_TRUST_HOST=true`
4. Redeploy

### WebSocket prices not updating on market detail

**Cause**: CSP violation blocking WebSocket connection

**Check**:
1. Open browser DevTools > Console
2. Look for CSP error mentioning `wss://ws-subscriptions-clob.polymarket.com`
3. The `next.config.ts` should already allow this — if error persists, check CSP headers

**Fix**:
1. Verify `next.config.ts` has `connect-src` including WebSocket URL
2. Rebuild and redeploy

### Admin dashboard returns 403 Forbidden

**Cause**: User doesn't have `role: "admin"` in database

**Fix**:
1. Connect to your database (use Vercel Postgres dashboard or `psql`)
2. Update the user:
   ```sql
   UPDATE "User" SET role = 'admin' WHERE email = 'admin@example.com';
   ```
3. User must sign out and back in to refresh JWT token

### Email notifications not sending

**Cause**: `RESEND_API_KEY` not set or domain not verified

**Fix**:
1. Create account at https://resend.com
2. Generate API key and set `RESEND_API_KEY` in Vercel
3. Verify your domain in Resend dashboard (or use default `onboarding@resend.dev`)
4. Set `EMAIL_FROM="PredictFlow <your-verified-domain>"`
5. Redeploy

### Prices seem stale or not real-time

**Cause**: API caching headers

**Check**: This is normal — the API cache is 30s. WebSocket updates should be instant.

**Verify**:
1. Market detail page should show real-time bid/ask from WebSocket
2. Market list may show cached prices (okay for performance)
3. If stuck for >60s, check browser DevTools > Network > WS for WebSocket errors

## npm Scripts Reference

After deploying, use these commands to manage the production database:

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server locally (port 3100) |
| `npm run build` | Production build (runs on Vercel automatically) |
| `npm start` | Start production server (used by Vercel) |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run type-check` | TypeScript type check |
| `npm test` | Run all tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run db:push` | Push Prisma schema to database (runs migrations) |
| `npm run db:migrate` | Create new Prisma migration |
| `npm run db:seed` | Seed demo prediction events |
| `npm run db:generate` | Regenerate Prisma client (usually automatic) |
| `npm run db:studio` | Open Prisma Studio (web UI for database) |
| `npm run bot:telegram:setup` | Register Telegram webhook |
| `npm run bot:discord:setup` | Register Discord commands |

### Running commands in production

To run scripts in the deployed Vercel environment:

```bash
# Push schema to production database
vercel exec "npm run db:push"

# Seed production database
vercel exec "npm run db:seed"

# Generate Prisma client
vercel exec "npm run db:generate"
```

## Next Steps

After deployment:

1. **Monitor**: Watch Vercel Dashboard for errors and performance metrics
2. **Test**: Use the verification checklist above
3. **Configure**: Set up OAuth, email, or bot integrations as needed
4. **Customize**: Update site name, logo, and branding in app
5. **Scale**: If traffic grows, consider:
   - Upgrading database tier
   - Adding caching layer (Redis)
   - Enabling Vercel Edge Caching for static content

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NextAuth Docs**: https://next-auth.js.org
- **PredictFlow Issues**: Check the GitHub repository

## Related Documentation

- [Local Development](./DEV.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [API Reference](./API.md)
