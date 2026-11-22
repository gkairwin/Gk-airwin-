-- Serialize same-player placements and safely reuse an existing round/slot row.
CREATE OR REPLACE FUNCTION public.place_bet(
  p_round_id BIGINT,
  p_amount NUMERIC,
  p_slot SMALLINT,
  p_auto_cashout NUMERIC
)
RETURNS public.bets
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
  IF bal IS NULL THEN RAISE EXCEPTION 'Not enough balance'; END IF;

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
  ON CONFLICT (round_id, user_id, slot) DO NOTHING
  RETURNING * INTO b;

  IF b.id IS NULL THEN
    -- An overlapping request already created the bet; undo this request's debit.
    UPDATE public.profiles SET balance = balance + p_amount WHERE id = uid;
    SELECT * INTO b FROM public.bets
    WHERE round_id = p_round_id AND user_id = uid AND slot = COALESCE(p_slot, 0);
  END IF;

  RETURN b;
END;
$function$;

REVOKE ALL ON FUNCTION public.place_bet(BIGINT, NUMERIC, SMALLINT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_bet(BIGINT, NUMERIC, SMALLINT, NUMERIC) TO authenticated, service_role;