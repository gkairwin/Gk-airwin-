CREATE OR REPLACE FUNCTION public.place_bet(p_round_id bigint, p_amount numeric, p_slot smallint, p_auto_cashout numeric)
 RETURNS bets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  SELECT balance INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  IF bal IS NULL OR bal < p_amount THEN RAISE EXCEPTION 'Not enough balance'; END IF;

  UPDATE public.profiles SET balance = balance - p_amount WHERE id = uid;

  INSERT INTO public.bets (round_id, user_id, slot, amount, auto_cashout, status)
  VALUES (p_round_id, uid, COALESCE(p_slot, 0), p_amount, p_auto_cashout, 'placed')
  RETURNING * INTO b;

  RETURN b;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cash_out_at(p_bet_id uuid, p_multiplier numeric)
 RETURNS bets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := auth.uid();
  b public.bets;
  r public.rounds;
  elapsed DOUBLE PRECISION;
  server_m NUMERIC;
  m NUMERIC;
  payout NUMERIC;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO b FROM public.bets WHERE id = p_bet_id AND user_id = uid FOR UPDATE;
  IF b.id IS NULL THEN RAISE EXCEPTION 'Bet not found'; END IF;
  IF b.status <> 'placed' THEN RETURN b; END IF;

  SELECT * INTO r FROM public.rounds WHERE id = b.round_id;
  IF now() < r.takeoff_at - INTERVAL '1 second' THEN RAISE EXCEPTION 'Plane has not taken off yet'; END IF;

  -- server-side multiplier with a small allowance for network delay
  elapsed := GREATEST(0, EXTRACT(EPOCH FROM (now() - r.takeoff_at)) + 1.0);
  server_m := round(exp(0.115 * elapsed)::numeric, 2);
  m := COALESCE(p_multiplier, server_m);
  IF m > server_m THEN m := server_m; END IF;
  IF m < 1 THEN m := 1; END IF;

  -- auto cash out already reached earlier
  IF b.auto_cashout IS NOT NULL AND b.auto_cashout < r.crash_point AND m > b.auto_cashout THEN
    m := b.auto_cashout;
  END IF;

  IF m >= r.crash_point OR now() > r.crash_at + INTERVAL '1500 milliseconds' THEN
    IF b.auto_cashout IS NOT NULL AND b.auto_cashout < r.crash_point THEN
      m := b.auto_cashout;
    ELSE
      UPDATE public.bets SET status = 'lost', win = 0 WHERE id = b.id RETURNING * INTO b;
      RETURN b;
    END IF;
  END IF;

  payout := round(b.amount * m, 2);
  UPDATE public.profiles SET balance = balance + payout WHERE id = uid;
  UPDATE public.bets SET status = 'won', cashed_multiplier = m, win = payout
  WHERE id = b.id RETURNING * INTO b;
  RETURN b;
END;
$function$;

REVOKE ALL ON FUNCTION public.cash_out_at(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cash_out_at(uuid, numeric) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.settle_my_bets()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    WHERE bt.user_id = uid AND bt.status = 'placed' AND now() >= rd.crash_at + INTERVAL '2 seconds'
    FOR UPDATE OF bt
  LOOP
    SELECT * INTO r FROM public.rounds WHERE id = b.round_id;
    IF b.auto_cashout IS NOT NULL AND b.auto_cashout < r.crash_point THEN
      payout := round(b.amount * b.auto_cashout, 2);
      UPDATE public.profiles SET balance = balance + payout WHERE id = uid;
      UPDATE public.bets SET status = 'won', cashed_multiplier = b.auto_cashout, win = payout WHERE id = b.id;
    ELSE
      UPDATE public.bets SET status = 'lost', win = 0 WHERE id = b.id;
    END IF;
  END LOOP;
END;
$function$;