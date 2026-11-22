CREATE OR REPLACE FUNCTION public.get_current_round()
RETURNS public.rounds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r public.rounds;
  last_r public.rounds;
  cp NUMERIC;
  u DOUBLE PRECISION;
  start_ts TIMESTAMPTZ;
  ft DOUBLE PRECISION;
BEGIN
  SELECT * INTO r FROM public.rounds WHERE now() < end_at ORDER BY id ASC LIMIT 1;
  IF r.id IS NOT NULL THEN
    RETURN r;
  END IF;

  PERFORM pg_advisory_xact_lock(918273645);

  SELECT * INTO r FROM public.rounds WHERE now() < end_at ORDER BY id ASC LIMIT 1;
  IF r.id IS NOT NULL THEN
    RETURN r;
  END IF;

  UPDATE public.bets b SET status = 'lost', win = 0
  WHERE b.status = 'placed'
    AND EXISTS (SELECT 1 FROM public.rounds rr WHERE rr.id = b.round_id AND now() >= rr.crash_at);

  SELECT * INTO last_r FROM public.rounds ORDER BY id DESC LIMIT 1;

  u := random();
  cp := round((0.97 / GREATEST(u, 0.0001))::numeric, 2);
  cp := GREATEST(1.01, LEAST(100, cp));

  start_ts := GREATEST(COALESCE(last_r.end_at, now()), now());
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
$function$;

CREATE OR REPLACE FUNCTION public.ensure_future_rounds(p_count integer DEFAULT 2)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cur public.rounds;
  last_r public.rounds;
  cnt INTEGER;
  cp NUMERIC;
  u DOUBLE PRECISION;
  ft DOUBLE PRECISION;
  start_ts TIMESTAMPTZ;
BEGIN
  cur := public.get_current_round();
  PERFORM pg_advisory_xact_lock(918273646);
  LOOP
    SELECT count(*) INTO cnt FROM public.rounds WHERE id > cur.id;
    EXIT WHEN cnt >= GREATEST(COALESCE(p_count, 2), 1);
    SELECT * INTO last_r FROM public.rounds ORDER BY id DESC LIMIT 1;
    u := random();
    cp := round((0.97 / GREATEST(u, 0.0001))::numeric, 2);
    cp := GREATEST(1.01, LEAST(100, cp));
    start_ts := last_r.end_at;
    ft := ln(cp::double precision) / 0.115;
    INSERT INTO public.rounds (crash_point, bet_open_at, takeoff_at, crash_at, end_at)
    VALUES (
      cp,
      start_ts,
      start_ts + INTERVAL '6 seconds',
      start_ts + INTERVAL '6 seconds' + (ft || ' seconds')::interval,
      start_ts + INTERVAL '6 seconds' + (ft || ' seconds')::interval + INTERVAL '4 seconds'
    );
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upcoming_rounds(p_count integer DEFAULT 2)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cur public.rounds;
  crashed BOOLEAN;
  nxt jsonb;
BEGIN
  PERFORM public.ensure_future_rounds(GREATEST(COALESCE(p_count, 2), 1));
  cur := public.get_current_round();
  crashed := now() >= cur.crash_at;

  SELECT COALESCE(jsonb_agg(x ORDER BY x_id), '[]'::jsonb) INTO nxt
  FROM (
    SELECT r.id AS x_id,
           jsonb_build_object(
             'id', r.id,
             'crashPoint', r.crash_point,
             'takeoffAt', extract(epoch from r.takeoff_at) * 1000
           ) AS x
    FROM public.rounds r
    WHERE r.id > cur.id
    ORDER BY r.id ASC
    LIMIT GREATEST(COALESCE(p_count, 2), 1)
  ) s;

  RETURN jsonb_build_object(
    'serverNow', extract(epoch from now()) * 1000,
    'current', jsonb_build_object(
      'id', cur.id,
      'crashPoint', cur.crash_point,
      'takeoffAt', extract(epoch from cur.takeoff_at) * 1000,
      'crashedAt', CASE WHEN crashed THEN extract(epoch from cur.crash_at) * 1000 ELSE NULL END
    ),
    'next', nxt
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.ensure_future_rounds(integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.upcoming_rounds(integer) TO authenticated, anon;