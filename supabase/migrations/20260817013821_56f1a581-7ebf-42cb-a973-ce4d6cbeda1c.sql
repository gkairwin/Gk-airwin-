DROP POLICY IF EXISTS "rounds_public_read" ON public.rounds;
REVOKE SELECT ON public.rounds FROM anon, authenticated;

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

REVOKE ALL ON FUNCTION public.current_round_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.round_history(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_round_state() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.round_history(INT) TO anon, authenticated, service_role;