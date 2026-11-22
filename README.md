# GK Airwin Aviator

A real-time crash game with phone + PIN accounts, server-settled rounds and
M-Pesa (NestLink) deposits. Built with TanStack Start (React 19 + Vite) and a
Postgres/Supabase-compatible backend.

## Local development

```bash
bun install
bun run dev      # http://localhost:8080
```

Copy `.env.example` to `.env` and fill in the values.

## Environment variables

Browser (safe to expose, injected at build time):

| Name | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Backend project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key (public by design) |
| `VITE_SUPABASE_PROJECT_ID` | Project ref |

Server only — **never** prefix these with `VITE_`, they must never reach the browser:

| Name | Purpose |
| --- | --- |
| `SUPABASE_URL` | Backend project URL for server functions |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key for SSR reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — writes deposits, credits balances |
| `NESTLINK_API_SECRET` | NestLink `Api-Secret` used for the M-Pesa STK push |

## Deploying to Vercel

1. Import the repository into Vercel. The build is auto-detected
   (`bun run build`); the server target is selected automatically from the
   Vercel build environment.
2. In **Project Settings → Environment Variables**, add every variable listed
   above for *Production*, *Preview* and *Development*.
3. Redeploy. Server code (deposits, round settlement, balances) runs as Vercel
   serverless functions from the same deployment — there is no separate
   backend service to host.

### Deposit flow (server-side only)

All money paths live in server functions and never run in the browser:

- `src/routes/api/public/deposit.ts` + `src/lib/deposits.server.ts`
  - `startDeposit` — authenticated; inserts the pending deposit, calls
    `POST https://api.nestlink.co.ke/runPrompt` with the `Api-Secret` header.
  - `checkDeposit` — authenticated; polls
    `POST https://api.nestlink.co.ke/trackTransaction`, then calls the
    `finalize_deposit` database function which credits the balance exactly once.
- Secrets are read inside the handlers via `process.env`, so they are stripped
  from the client bundle.
- There are no Edge Functions and no public API routes in the deposit path;
  the client only calls the two RPC endpoints above, and both require a signed-in
  session.

### Verifying on your Vercel domain

1. Open `https://<your-domain>/auth`, register with a phone number + 4-digit PIN.
2. Tap the balance → **Deposit**, enter a Safaricom number and an amount.
3. Approve the STK prompt on the handset; the dialog polls until the deposit is
   credited and the balance updates.
4. If it fails, check the Vercel function logs for the deployment — a missing
   `NESTLINK_API_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` is the usual cause.
