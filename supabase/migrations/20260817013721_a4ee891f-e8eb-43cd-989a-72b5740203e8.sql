CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE TABLE public.rounds (
  id BIGSERIAL PRIMARY KEY,
  crash_point NUMERIC(10,2) NOT NULL,
  bet_open_at TIMESTAMPTZ NOT NULL,
  takeoff_at TIMESTAMPTZ NOT NULL,
  crash_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rounds TO authenticated, anon;
GRANT ALL ON public.rounds TO service_role;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rounds_public_read" ON public.rounds FOR SELECT TO authenticated, anon USING (true);

CREATE TABLE public.bets (
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
CREATE UNIQUE INDEX bets_round_user_slot_idx ON public.bets(round_id, user_id, slot);
CREATE INDEX bets_user_idx ON public.bets(user_id, created_at DESC);
GRANT SELECT ON public.bets TO authenticated;
GRANT ALL ON public.bets TO service_role;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bets_select_own" ON public.bets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.deposits (
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
CREATE INDEX deposits_user_idx ON public.deposits(user_id, created_at DESC);
GRANT SELECT ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deposits_select_own" ON public.deposits FOR SELECT TO authenticated USING (auth.uid() = user_id);

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

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Lazily creates and returns the round that is currently running.
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

CREATE OR REPLACE FUNCTION public.place_bet(p_round_id BIGINT, p_amount NUMERIC, p_slot SMALLINT, p_auto_cashout NUMERIC)
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
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 100000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT * INTO r FROM public.rounds WHERE id = p_round_id;
  IF r.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF now() >= r.takeoff_at THEN RAISE EXCEPTION 'betting_closed'; END IF;

  UPDATE public.profiles SET balance = balance - p_amount
  WHERE id = uid AND balance >= p_amount
  RETURNING balance INTO bal;
  IF bal IS NULL THEN RAISE EXCEPTION 'insufficient_balance'; END IF;

  INSERT INTO public.bets (round_id, user_id, slot, amount, auto_cashout)
  VALUES (p_round_id, uid, COALESCE(p_slot, 0), p_amount, p_auto_cashout)
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

REVOKE ALL ON FUNCTION public.get_current_round() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.place_bet(BIGINT, NUMERIC, SMALLINT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_bet(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cash_out(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_my_bets() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_round() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.place_bet(BIGINT, NUMERIC, SMALLINT, NUMERIC) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_bet(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cash_out(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.settle_my_bets() TO authenticated, service_role;