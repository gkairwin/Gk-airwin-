-- Deposit settlement is exclusively for the trusted server after provider verification.
REVOKE ALL ON FUNCTION public.finalize_deposit(text, boolean, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_deposit(text, boolean, text, text, text) TO service_role;
DO $migration$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.finalize_deposit(text,boolean,text,text,text)'::regprocedure) INTO definition;
  definition := replace(definition, E'BEGIN\n', E'BEGIN\n  IF auth.role() IS DISTINCT FROM ''service_role'' THEN\n    RAISE EXCEPTION ''not_authorized'';\n  END IF;\n');
  EXECUTE definition;
END;
$migration$;

-- Signup metadata may describe this profile, but must never claim a different wallet.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, phone, balance, country_code)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'phone', 0, NEW.raw_user_meta_data ->> 'country_code')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Preserve existing cash-out timing and payouts; gate each action inside the database.
-- Lock the owned bet first, then its profile, matching the existing settlement lock order.
DO $migration$
DECLARE signature text; definition text;
BEGIN
  FOREACH signature IN ARRAY ARRAY['public.cash_out_at(uuid,numeric)', 'public.cash_out(uuid)', 'public.cancel_bet(uuid)'] LOOP
    SELECT pg_get_functiondef(signature::regprocedure) INTO definition;
    IF position('SELECT * INTO b FROM public.bets WHERE id = p_bet_id AND user_id = uid FOR UPDATE;' IN definition) = 0 THEN
      RAISE EXCEPTION 'Unexpected bet function definition';
    END IF;
    definition := replace(definition,
      'SELECT * INTO b FROM public.bets WHERE id = p_bet_id AND user_id = uid FOR UPDATE;',
      E'SELECT * INTO b FROM public.bets WHERE id = p_bet_id AND user_id = uid FOR UPDATE;\n  PERFORM 1 FROM public.profiles WHERE id = uid AND NOT suspended FOR UPDATE;\n  IF NOT FOUND THEN RAISE EXCEPTION ''account_suspended''; END IF;');
    EXECUTE definition;
  END LOOP;
END;
$migration$;