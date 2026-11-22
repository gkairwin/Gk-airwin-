CREATE OR REPLACE FUNCTION public.admin_credit(p_user uuid, p_amount numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE nb numeric;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 10000000 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  UPDATE public.profiles SET balance = balance + p_amount WHERE id = p_user RETURNING balance INTO nb;
  IF nb IS NULL THEN RAISE EXCEPTION 'account_not_found'; END IF;
  RETURN nb;
END; $$;
REVOKE ALL ON FUNCTION public.admin_credit(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_credit(uuid, numeric) TO service_role;