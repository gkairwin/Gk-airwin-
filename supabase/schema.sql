-- GK Airwin Aviator — full database schema.
-- Paste this whole file into a FRESH Supabase project's SQL Editor and Run.
-- It is idempotent: safe to re-run.
--
-- What it creates:
--   tables : profiles, rounds, bets, deposits
--   trigger: auto-create a profile row when a new auth user signs up
--   funcs  : get_current_round, current_round_state, round_history,
--            place_bet, cancel_bet, cash_out, settle_my_bets, finalize_deposit
--   access : RLS on every table; money paths run only through SECURITY DEFINER
--            functions. Rounds/deposits are not directly readable by clients;
--            clients read round state via the RPC functions.

-- ===========================================================================
-- 1. TABLES
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rounds (
  id BIGSERIAL PRIMARY KEY,
  crash_point NUMERIC(10,2) NOT NULL,
  bet_open_at TIMESTAMPTZ NOT NULL,
  takeoff_at TIMESTAMPTZ NOT NULL,
  crash_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id BIGINT NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL DEFAULT 0,
  amount NUMERIC(14,2) NOT NULL,
  auto_cashout NUMERIC(10,2),
  cashed_multiplier NUMERIC(10,2),
  win NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'placed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL UNIQUE,
  ld_id TEXT,
  confirmation_link TEXT,
  phone TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  mpesa_ref TEXT,
  result_code TEXT,
  result_desc TEXT,
  credited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================================================
-- 2. INDEXES
-- ===========================================================================

CREATE UNIQUE INDEX IF NOT EXISTS bets_round_user_slot_idx
  ON public.bets(round_id, user_id, slot);
CREATE INDEX IF NOT EXISTS bets_user_idx
  ON public.bets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS deposits_user_idx
  ON public.deposits(user_id, created_at DESC);

-- ===========================================================================
-- 3. GRANTS  (PostgREST needs explicit grants on the public schema)
-- ===========================================================================

-- profiles: each user reads only their own row.
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- rounds: NOT directly readable by clients. Round state is exposed only through
-- the SECURITY DEFINER functions (current_round_state / round_history).
GRANT ALL ON public.rounds TO service_role;

-- bets: each user reads only their own bets. Writes go through place_bet /
-- cancel_bet / cash_out / settle_my_bets.
GRANT SELECT ON public.bets TO authenticated;
GRANT ALL ON public.bets TO service_role;

-- deposits: each user reads only their own deposits. Crediting is done by the
-- service-role-only finalize_deposit function.
GRANT SELECT ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;

-- ===========================================================================
-- 4. ROW LEVEL SECURITY
-- ===========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
-- No SELECT policy: rounds are locked from direct client reads.

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bets_select_own"
  ON public.bets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deposits_select_own"
  ON public.deposits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ===========================================================================
-- 5. AUTO-PROFILE TRIGGER  (runs when a new auth user signs up)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================================================
-- 6. ROUND ENGINE
-- ===========================================================================

-- Lazily creates and returns the round that is currently running. If the last
-- round has ended, it settles any leftover placed bets as lost and inserts a
-- new round with a fresh crash point.
CREATE OR REPLACE FUNCTION public.get_current_round()
RETURNS public.rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.rounds;
  cp NUMERIC;
  u DOUBLE PRECISION;
  start_ts TIMESTAMPTZ;
  ft DOUBLE PRECISION;
BEGIN
  SELECT * INTO r FROM public.rounds ORDER BY id DESC LIMIT 1;
  IF r.id IS NOT NULL AND now() < r.end_at THEN
    RETURN r;
  END IF;

  PERFORM pg_advisory_xact_lock(918273645);

  SELECT * INTO r FROM public.rounds ORDER BY id DESC LIMIT 1;
  IF r.id IS NOT NULL AND now() < r.end_at THEN
    RETURN r;
  END IF;

  IF r.id IS NOT NULL THEN
    UPDATE public.bets SET status = 'lost', win = 0
    WHERE round_id = r.id AND status = 'placed';
  END IF;

  u := random();
  cp := round((0.97 / GREATEST(u, 0.0001))::numeric, 2);
  cp := GREATEST(1.01, LEAST(100, cp));

  start_ts := GREATEST(COALESCE(r.end_at, now()), now());
  ft := ln(cp::double precision) / 0.115;

  INSERT INTO public.rounds (crash_point, bet_open_at, takeoff_at, crash_at, end_at)
  VALUES (
    cp,
    start_ts,
    start_ts + INTERVAL '6 seconds',
    start_ts + INTERVAL '6 seconds' + (ft || ' seconds')::interval,
    start_ts + INTERVAL '6 seconds' + (ft || ' seconds')::interval + INTERVAL '4 seconds'
  )
  RETURNING * INTO r;

  RETURN r;
END;
$$;

-- Returns the current round's timing + crash point (crash point only once
-- the round has crashed) as a single JSON object for the client.
CREATE OR REPLACE FUNCTION public.current_round_state()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.rounds;
  crashed BOOLEAN;
BEGIN
  r := public.get_current_round();
  crashed := now() >= r.crash_at;
  RETURN jsonb_build_object(
    'id', r.id,
    'serverNow', extract(epoch from now()) * 1000,
    'betOpenAt', extract(epoch from r.bet_open_at) * 1000,
    'takeoffAt', extract(epoch from r.takeoff_at) * 1000,
    'crashedAt', CASE WHEN crashed THEN extract(epoch from r.crash_at) * 1000 ELSE NULL END,
    'crashPoint', CASE WHEN crashed THEN r.crash_point ELSE NULL END,
    'endAt', CASE WHEN crashed THEN extract(epoch from r.end_at) * 1000 ELSE NULL END
  );
END;
$$;

-- Last N finished rounds' crash points, newest first (for the history strip).
CREATE OR REPLACE FUNCTION public.round_history(p_limit INT DEFAULT 24)
RETURNS TABLE (id BIGINT, crash_point NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.crash_point
  FROM public.rounds r
  WHERE now() >= r.crash_at
  ORDER BY r.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 24), 1), 50);
$$;

-- ===========================================================================
-- 7. BET FUNCTIONS  (place / cancel / cash out / settle)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.place_bet(
  p_round_id BIGINT,
  p_amount NUMERIC,
  p_slot SMALLINT,
  p_auto_cashout NUMERIC
)
RETURNS public.bets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  r public.rounds;
  b public.bets;
  bal NUMERIC;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_amount IS NULL OR p_amount < 100 OR p_amount > 100000 THEN RAISE EXCEPTION 'Minimum bet is 100 KES'; END IF;

  SELECT * INTO r FROM public.rounds WHERE id = p_round_id;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Round not ready, try again'; END IF;
  IF now() >= r.takeoff_at + INTERVAL '300 milliseconds' THEN RAISE EXCEPTION 'Betting closed for this round'; END IF;

  -- Lock the player's balance row first: serialises concurrent bets by the
  -- same player, so two rapid taps can never race two inserts.
  SELECT balance INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  IF bal IS NULL THEN RAISE EXCEPTION 'Not enough balance'; END IF;

  -- A row for this round+player+slot may already exist (double tap, or a
  -- previously cancelled bet). Reuse it instead of raising duplicate-key.
  SELECT * INTO b FROM public.bets
  WHERE round_id = p_round_id AND user_id = uid AND slot = COALESCE(p_slot, 0)
  FOR UPDATE;
  IF b.id IS NOT NULL THEN
    IF b.status = 'placed' THEN RETURN b; END IF;
    IF bal < p_amount THEN RAISE EXCEPTION 'Not enough balance'; END IF;
    UPDATE public.profiles SET balance = balance - p_amount WHERE id = uid;
    UPDATE public.bets
      SET amount = p_amount, auto_cashout = p_auto_cashout, status = 'placed',
          cashed_multiplier = NULL, win = NULL
      WHERE id = b.id
      RETURNING * INTO b;
    RETURN b;
  END IF;

  IF bal < p_amount THEN RAISE EXCEPTION 'Not enough balance'; END IF;
  UPDATE public.profiles SET balance = balance - p_amount WHERE id = uid;

  INSERT INTO public.bets (round_id, user_id, slot, amount, auto_cashout, status)
  VALUES (p_round_id, uid, COALESCE(p_slot, 0), p_amount, p_auto_cashout, 'placed')
  RETURNING * INTO b;

  RETURN b;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_bet(p_bet_id UUID)
RETURNS public.bets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  b public.bets;
  r public.rounds;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO b FROM public.bets WHERE id = p_bet_id AND user_id = uid FOR UPDATE;
  IF b.id IS NULL THEN RAISE EXCEPTION 'bet_not_found'; END IF;
  IF b.status <> 'placed' THEN RAISE EXCEPTION 'bet_not_cancellable'; END IF;

  SELECT * INTO r FROM public.rounds WHERE id = b.round_id;
  IF now() >= r.takeoff_at THEN RAISE EXCEPTION 'betting_closed'; END IF;

  UPDATE public.profiles SET balance = balance + b.amount WHERE id = uid;
  UPDATE public.bets SET status = 'cancelled' WHERE id = b.id RETURNING * INTO b;
  RETURN b;
END;
$$;

CREATE OR REPLACE FUNCTION public.cash_out(p_bet_id UUID)
RETURNS public.bets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  b public.bets;
  r public.rounds;
  elapsed DOUBLE PRECISION;
  m NUMERIC;
  payout NUMERIC;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO b FROM public.bets WHERE id = p_bet_id AND user_id = uid FOR UPDATE;
  IF b.id IS NULL THEN RAISE EXCEPTION 'bet_not_found'; END IF;
  IF b.status <> 'placed' THEN RAISE EXCEPTION 'bet_not_active'; END IF;

  SELECT * INTO r FROM public.rounds WHERE id = b.round_id;
  IF now() < r.takeoff_at THEN RAISE EXCEPTION 'not_flying'; END IF;

  IF now() >= r.crash_at THEN
    UPDATE public.bets SET status = 'lost', win = 0 WHERE id = b.id RETURNING * INTO b;
    RETURN b;
  END IF;

  elapsed := EXTRACT(EPOCH FROM (now() - r.takeoff_at));
  m := round(exp(0.115 * elapsed)::numeric, 2);
  IF b.auto_cashout IS NOT NULL AND b.auto_cashout <= r.crash_point AND m > b.auto_cashout THEN
    m := b.auto_cashout;
  END IF;
  IF m < 1 THEN m := 1; END IF;
  IF m > r.crash_point THEN m := r.crash_point; END IF;

  payout := round(b.amount * m, 2);
  UPDATE public.profiles SET balance = balance + payout WHERE id = uid;
  UPDATE public.bets SET status = 'won', cashed_multiplier = m, win = payout
  WHERE id = b.id RETURNING * INTO b;
  RETURN b;
END;
$$;

-- Settles auto cash-outs and losses for finished rounds for the calling user.
CREATE OR REPLACE FUNCTION public.settle_my_bets()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  b public.bets;
  r public.rounds;
  payout NUMERIC;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  FOR b IN
    SELECT bt.* FROM public.bets bt
    JOIN public.rounds rd ON rd.id = bt.round_id
    WHERE bt.user_id = uid AND bt.status = 'placed' AND now() >= rd.crash_at
    FOR UPDATE OF bt
  LOOP
    SELECT * INTO r FROM public.rounds WHERE id = b.round_id;
    IF b.auto_cashout IS NOT NULL AND b.auto_cashout <= r.crash_point THEN
      payout := round(b.amount * b.auto_cashout, 2);
      UPDATE public.profiles SET balance = balance + payout WHERE id = uid;
      UPDATE public.bets SET status = 'won', cashed_multiplier = b.auto_cashout, win = payout WHERE id = b.id;
    ELSE
      UPDATE public.bets SET status = 'lost', win = 0 WHERE id = b.id;
    END IF;
  END LOOP;
END;
$$;

-- ===========================================================================
-- 8. DEPOSIT FINALISATION  (service-role only; called from the server fn)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.finalize_deposit(
  p_local_id TEXT,
  p_paid BOOLEAN,
  p_mpesa_ref TEXT,
  p_result_code TEXT,
  p_result_desc TEXT
)
RETURNS public.deposits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d public.deposits;
BEGIN
  SELECT * INTO d FROM public.deposits WHERE local_id = p_local_id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'deposit_not_found'; END IF;

  IF d.credited THEN
    RETURN d;
  END IF;

  IF p_paid THEN
    UPDATE public.profiles SET balance = balance + d.amount WHERE id = d.user_id;
    UPDATE public.deposits
      SET status = 'paid', credited = true, mpesa_ref = NULLIF(p_mpesa_ref, ''),
          result_code = NULLIF(p_result_code, ''), result_desc = NULLIF(p_result_desc, ''),
          updated_at = now()
      WHERE id = d.id RETURNING * INTO d;
  ELSIF COALESCE(p_result_code, '') <> '' THEN
    UPDATE public.deposits
      SET status = 'failed', result_code = p_result_code,
          result_desc = NULLIF(p_result_desc, ''), updated_at = now()
      WHERE id = d.id RETURNING * INTO d;
  END IF;

  RETURN d;
END;
$$;

-- ===========================================================================
-- 9. FUNCTION EXECUTE GRANTS
-- ===========================================================================

REVOKE ALL ON FUNCTION public.get_current_round() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_round_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.round_history(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.place_bet(BIGINT, NUMERIC, SMALLINT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_bet(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cash_out(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_my_bets() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_deposit(TEXT, BOOLEAN, TEXT, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_current_round()               TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_round_state()              TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.round_history(INT)                 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.place_bet(BIGINT, NUMERIC, SMALLINT, NUMERIC) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_bet(UUID)                   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cash_out(UUID)                    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.settle_my_bets()                  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finalize_deposit(TEXT, BOOLEAN, TEXT, TEXT, TEXT) TO service_role;

-- Done. Now set your auth provider to Email-only and turn OFF "Confirm email"
-- (the phone+PIN sign-in maps to synthetic email credentials internally).
