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