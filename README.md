# Stock Competition Platform

A full-stack Next.js 16 (App Router) application for running stock-picking competitions with real-time Supabase data, email/Google sign-in, dynamic price feeds, and an admin suite for managing participants, manual prices, and competition settings.

> **Live demo:** https://stock-competition.vercel.app

---

## Features

- **Supabase Authentication** – Email/password with verification plus Google OAuth, session refresh middleware, and `/auth/callback` handler.
- **Participant auto-provisioning** – Any authenticated user that visits the dashboard is inserted into the `participants` table with a sensible default display name.
- **Stock Picks + Portfolio** – Participants select 10 tickers, get live entry/current values, and see gains updated via `/api/current-price` and `/api/stock-price`.
- **Leaderboard** – Server-driven recalculation of portfolio performance with highlight of the logged-in user.
- **Admin Console** – Manage competitions, add/remove participants, override entry prices, and configure refresh rates.
- **Manual + API price sources** – Switch between Yahoo Finance and Alpha Vantage, cache responses, and fall back to admin-provided prices when needed.
- **Theming & polish** – Persistent light/dark/system toggle, landing page marketing content, Tailwind v4 styles, Lucide icons, and custom logo badges fetched through logo.dev (proxied & cached).

---

## Tech Stack

| Layer            | Details                                                                 |
|------------------|--------------------------------------------------------------------------|
| Frontend         | Next.js 16 App Router, React 19, Tailwind CSS v4, ShadCN-style UI kit    |
| Auth & Database  | Supabase (PostgreSQL + Auth + Row Level Security)                        |
| Pricing APIs     | Yahoo Finance (chart API) & Alpha Vantage (GLOBAL_QUOTE / TIME_SERIES)   |
| Assets/Icons     | logo.dev (ticker logos), Lucide React icons                              |
| Deployment       | Vercel (Preview + Production)                                            |

Directory highlights:

```
├─ app/                   # App Router routes (dashboard, auth, api handlers)
├─ components/            # Dashboard, admin, settings, theme, and UI primitives
├─ lib/supabase/          # Server/browser/middleware Supabase helpers
├─ public/                # Static assets
└─ scripts/               # Future automation hooks (placeholders)
```

---

## Prerequisites

- Node.js 20+ (Next.js 16 requirement)
- npm (bundled with Node) or your preferred package manager
- Supabase project with Auth + Database configured
- Accounts/API keys for:
  - [logo.dev](https://logo.dev) – ticker logos
  - [Alpha Vantage](https://www.alphavantage.co/) – optional historic pricing
  - Google Cloud OAuth client (if you want Google sign-in)

---

## Environment Variables

Create `.env.local` (for development) and configure the same values in Vercel → Project Settings → Environment Variables.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL (`https://<project>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public API key |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Absolute origin of your app (e.g., `https://stock-competition.vercel.app`). Used for email + OAuth redirects. |
| `LOGO_DEV_API_KEY` | ✅ | Server-side token used by `/api/logo/[ticker]` to proxy logo.dev images |
| `NEXT_PUBLIC_LOGO_DEV_API_KEY` | ✅ | Exposed token used by the client-side `StockLogo` component for caching logos |
| `ADMIN_EMAILS` | ⚙️ | Comma-separated list of admin emails (used in `app/admin/page.tsx` check) |
| `ALPHA_VANTAGE_API_KEY` | ⚙️ | Required only when competitions use the Alpha Vantage provider |

You can add any other Supabase service keys or secrets if you extend the admin tooling.

---

## Local Development

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev
# Visit http://localhost:3000
```

Recommended workflow:
1. Create `.env.local` with the variables above (you can copy `.env.local` from production, but never commit secrets).
2. In Supabase → Authentication → URL Configuration:
   - Set **Site URL** to `http://localhost:3000/auth/callback` (for dev) and your production URL for prod.
   - Add both URLs under **Additional Redirect URLs** so email + OAuth flows work in both environments.
3. Enable Google provider (optional): paste the Client ID/Secret from Google Cloud and add Supabase’s callback URL (`https://<project>.supabase.co/auth/v1/callback`) in Google Console.
4. Seed your `competitions`, `participants`, and `stock_picks` tables or use the admin panel to create them.

---

## Running Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js in development with hot reload |
| `npm run build` | Production build (runs `next build`) |
| `npm run start` | Run the compiled production server |
| `npm run lint` | ESLint (Next.js config) |

No automated tests are bundled yet—feel free to add Playwright/Cypress or Jest/Testing Library as needed.

---

## Deployment (Vercel)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, click **Add New Project** and import the repo.
3. Vercel auto-detects Next.js. Accept the defaults (`npm install`, `npm run build`, output `.next`).
4. Add the environment variables listed above (Production + Preview).
5. Deploy. Your project will be available at `<project>.vercel.app`.
6. To use a custom domain (e.g., `stock.uzairansar.com`), add it under Project → Settings → Domains and follow the DNS instructions (A/ALIAS for apex, CNAME for subdomains).

---

## Supabase Tips & Troubleshooting

- **`{"message":"No API key found in request"}`** – Supabase is redirecting to its own domain. Double-check Auth → URL Configuration. Every entry must include `https://` or `http://`.
- **Google OAuth loop** – Ensure Google Console & Supabase both use the same callback URL (`https://<project>.supabase.co/auth/v1/callback`) and that `NEXT_PUBLIC_SITE_URL` points to your deployed origin.
- **Participants missing** – Any user that opens `/dashboard` is auto-inserted into `participants`. If you bulk-import users via Supabase Dashboard, ensure they also get entries in `participants`.
- **Logo errors** – On dev, check `/api/logo/<ticker>` in the browser. If you see the fallback SVG, confirm the `LOGO_DEV_API_KEY` and network connectivity.
- **Alpha Vantage throttling** – Their free tier is limited. Switch competitions to `yahoo_finance` or add manual entry prices under the admin panel if you hit rate limits.

---

## Contributing / Extending

1. Fork the repo and create a feature branch: `git checkout -b feature/my-improvement`.
2. Keep environment variables out of commits.
3. Run `npm run lint` before pushing.
4. Open a PR describing the change (include screenshots for UI updates).

Ideas for future improvements:
- Add automated tests for the API routes and dashboard components.
- Introduce websockets or Supabase realtime for leaderboard updates.
- Build CSV import/export for participants or stock picks.
- Add notifications (email or Slack) when competitions change.

---

## License

This project inherits the default license of the repository.
