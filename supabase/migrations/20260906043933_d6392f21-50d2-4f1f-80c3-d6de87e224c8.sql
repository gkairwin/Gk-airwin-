-- Deterministic slot-based rounds: epoch 2026-01-01T00:00:00Z, 30s slots, 6s betting.
CREATE OR REPLACE FUNCTION public.gk_hash32(n BIGINT)
RETURNS BIGINT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE x BIGINT;
BEGIN
  x := ((n % 4294967296) + 4294967296) % 4294967296;
  x := (x # (x >> 16));
  x := (x * 73244475) % 4294967296;
  x := (x # (x >> 16));
  x := (x * 73244475) % 4294967296;
  x := (x # (x >> 16));
  RETURN x;
END;
$$;

CREATE OR REPLACE FUNCTION public.gk_crash_point(idx BIGINT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE u DOUBLE PRECISION; raw DOUBLE PRECISION;
BEGIN
  u := (public.gk_hash32(idx * 2654435761) % 1000000)::double precision / 1000000.0;
  raw := 0.97 / GREATEST(u, 0.02);
  RETURN round(LEAST(12.0, GREATEST(1.01, raw))::numeric, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.gk_slot_index(ts TIMESTAMPTZ DEFAULT now())
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT floor((extract(epoch from ts) * 1000 - 1767225600000) / 30000)::bigint;
$$;

CREATE OR REPLACE FUNCTION public.gk_ensure_round(idx BIGINT)
RETURNS public.rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.rounds;
  cp NUMERIC;
  bo TIMESTAMPTZ;
  tk TIMESTAMPTZ;
  ft DOUBLE PRECISION;
BEGIN
  SELECT * INTO r FROM public.rounds WHERE id = idx;
  IF r.id IS NOT NULL THEN RETURN r; END IF;

  cp := public.gk_crash_point(idx);
  bo := to_timestamp((1767225600000 + idx * 30000) / 1000.0);
  tk := bo + INTERVAL '6 seconds';
  ft := ln(cp::double precision) / 0.115;

  INSERT INTO public.rounds (id, crash_point, bet_open_at, takeoff_at, crash_at, end_at)
  VALUES (idx, cp, bo, tk, tk + (ft || ' seconds')::interval, bo + INTERVAL '30 seconds')
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO r FROM public.rounds WHERE id = idx;
  RETURN r;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_round()
RETURNS public.rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.gk_ensure_round(public.gk_slot_index(now()));
END;
$$;

CREATE OR REPLACE FUNCTION public.round_history(p_limit INT DEFAULT 24)
RETURNS TABLE (id BIGINT, crash_point NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i AS id, public.gk_crash_point(i) AS crash_point
  FROM generate_series(
    public.gk_slot_index(now()) - LEAST(GREATEST(COALESCE(p_limit, 24), 1), 50),
    public.gk_slot_index(now()) - 1
  ) AS i
  ORDER BY i DESC;
$$;

DROP FUNCTION IF EXISTS public.upcoming_rounds(INT);
CREATE OR REPLACE FUNCTION public.upcoming_rounds(p_count INT DEFAULT 2)
RETURNS TABLE (id BIGINT, crash_point NUMERIC, bet_open_at TIMESTAMPTZ, takeoff_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i AS id,
         public.gk_crash_point(i) AS crash_point,
         to_timestamp((1767225600000 + i * 30000) / 1000.0) AS bet_open_at,
         to_timestamp((1767225600000 + i * 30000) / 1000.0) + INTERVAL '6 seconds' AS takeoff_at
  FROM generate_series(
    public.gk_slot_index(now()),
    public.gk_slot_index(now()) + LEAST(GREATEST(COALESCE(p_count, 2), 1), 10)
  ) AS i
  ORDER BY i;
$$;

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
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 100000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  r := public.gk_ensure_round(p_round_id);
  IF r.id IS NULL THEN RAISE EXCEPTION 'round_not_found'; END IF;
  IF now() >= r.takeoff_at THEN RAISE EXCEPTION 'betting_closed'; END IF;

  SELECT balance INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  IF bal IS NULL OR bal < p_amount THEN RAISE EXCEPTION 'insufficient_balance'; END IF;

  UPDATE public.profiles SET balance = balance - p_amount WHERE id = uid;

  INSERT INTO public.bets (round_id, user_id, slot, amount, auto_cashout, status)
  VALUES (p_round_id, uid, COALESCE(p_slot, 0), p_amount, p_auto_cashout, 'placed')
  RETURNING * INTO b;

  RETURN b;
END;
$$;

GRANT EXECUTE ON FUNCTION public.gk_hash32(BIGINT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.gk_crash_point(BIGINT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.gk_slot_index(TIMESTAMPTZ) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_round() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.round_history(INT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.upcoming_rounds(INT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.place_bet(BIGINT, NUMERIC, SMALLINT, NUMERIC) TO authenticated, service_role;
