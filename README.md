# CLNCH App

CLNCH is a Vite + React + TypeScript web app for tracking opportunities, chats, and onboarding workflows.

## Tech stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase Auth + data services

## Getting started

### 1) Install dependencies

```bash
npm ci
```

### 2) Configure environment variables

Create a `.env` file in `/home/runner/work/clnch-app/clnch-app`:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FIRECRAWL_API_KEY=your_firecrawl_api_key
```

### 3) Run locally

```bash
npm run dev
```

## Available scripts

- `npm run dev` — start local dev server
- `npm run build` — create production build
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint
- `npm run typecheck` — run TypeScript type checks

## Deployment notes (Vercel)

- This repo includes `vercel.json` rewrite rules so SPA routes (for example `/auth`) resolve correctly.
- For Google OAuth with Supabase, ensure:
  - Google redirect URI includes: `https://<supabase-project-ref>.supabase.co/auth/v1/callback`
  - Supabase Site URL and Additional Redirect URLs include your Vercel domain.
