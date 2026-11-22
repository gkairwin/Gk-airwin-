# Deploying GK Airwin on your own Supabase + Vercel

The app reads every backend value from environment variables — nothing is
hardcoded. To run it on your Vercel domain with your own backend you need a
Supabase project you own (so you hold the service-role key).

## 1. Create your Supabase project

1. Create a new project at supabase.com.
2. Open **SQL Editor**, paste the whole of `supabase/schema.sql`, run it.
   That creates `profiles`, `deposits`, `rounds`, `bets`, the RLS policies,
   grants, and the `finalize_deposit` / round functions.
3. Under **Authentication → Providers**, keep Email enabled (the phone + PIN
   sign-in maps to synthetic email credentials internally) and turn **off**
   "Confirm email", otherwise registrations hang unconfirmed.

Alternatively with the CLI:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

## 2. Collect the four values

From **Project Settings → API**:

| Value | Where it goes |
| --- | --- |
| Project URL | `VITE_SUPABASE_URL` and `SUPABASE_URL` |
| Publishable / anon key | `VITE_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_PUBLISHABLE_KEY` |
| Project ref | `VITE_SUPABASE_PROJECT_ID` |
| **service_role** key (secret) | `SUPABASE_SERVICE_ROLE_KEY` only |

From the NestLink dashboard: the `Api-Secret` → `NESTLINK_API_SECRET`.

## 3. Set them in Vercel

**Project Settings → Environment Variables**, add all seven for
*Production*, *Preview* and *Development*:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
NESTLINK_API_SECRET
```

Never prefix `SUPABASE_SERVICE_ROLE_KEY` or `NESTLINK_API_SECRET` with
`VITE_` — that would ship them to the browser.

Then **Deployments → Redeploy** (uncheck "use existing build cache").

## 4. Verify the deposit flow

1. `https://<your-domain>/auth` — register with a phone number + 4-digit PIN.
   Failure here means the Supabase URL/publishable key are wrong or email
   confirmation is still on.
2. Tap the balance → **Deposit**, enter a Safaricom number and an amount.
3. Approve the STK prompt on the handset. The dialog polls
   `checkDeposit` every 3s for up to 2 minutes.
4. The balance updates once `finalize_deposit` credits the row.

### If it fails

Check the Vercel **Functions** logs for that deployment:

| Log line | Cause |
| --- | --- |
| `Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY` | Var not set for that environment, or not redeployed after adding |
| `Payment service is not configured yet.` | `NESTLINK_API_SECRET` missing |
| `NestLink runPrompt failed [4xx]` | Wrong Api-Secret, or the phone/amount was rejected upstream |
| `Deposit not found` | Signed-in user differs from the deposit owner |
| `Expected 3 parts in JWT; got 1` | Publishable and service-role keys swapped |

Deposits only credit after NestLink reports the transaction paid; there is no
client-side path that can add balance.
