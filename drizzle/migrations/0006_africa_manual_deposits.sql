ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_code TEXT;

CREATE TABLE public.manual_deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL CHECK (country_code <> ''),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0 AND amount <= 10000000),
  payment_code TEXT NOT NULL CHECK (char_length(btrim(payment_code)) BETWEEN 6 AND 64),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT ON public.manual_deposit_requests TO authenticated;
GRANT ALL ON public.manual_deposit_requests TO service_role;
ALTER TABLE public.manual_deposit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY manual_deposit_requests_select_own ON public.manual_deposit_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY manual_deposit_requests_insert_own ON public.manual_deposit_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE UNIQUE INDEX manual_deposit_payment_code_unique ON public.manual_deposit_requests (lower(btrim(payment_code)));
CREATE INDEX manual_deposit_requests_pending_created_idx ON public.manual_deposit_requests (status, created_at DESC);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE ph text := NEW.raw_user_meta_data ->> 'phone'; legacy numeric := 0;
BEGIN
  IF ph ~ '^254[17][0-9]{8}$' THEN
    SELECT COALESCE(sum(balance),0) INTO legacy FROM public.profiles WHERE phone = '0' || substr(ph,4);
    UPDATE public.profiles SET balance = 0 WHERE phone = '0' || substr(ph,4);
  END IF;
  INSERT INTO public.profiles (id, email, phone, balance, country_code)
  VALUES (NEW.id, NEW.email, ph, legacy, NEW.raw_user_meta_data ->> 'country_code')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.approve_manual_deposit(p_request_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE req public.manual_deposit_requests; new_balance NUMERIC;
BEGIN
  SELECT * INTO req FROM public.manual_deposit_requests WHERE id = p_request_id FOR UPDATE;
  IF req.id IS NULL THEN RAISE EXCEPTION 'deposit_request_not_found'; END IF;
  IF req.status <> 'pending' THEN RAISE EXCEPTION 'deposit_request_already_reviewed'; END IF;
  UPDATE public.profiles SET balance = balance + req.amount WHERE id = req.user_id RETURNING balance INTO new_balance;
  IF new_balance IS NULL THEN RAISE EXCEPTION 'account_not_found'; END IF;
  UPDATE public.manual_deposit_requests SET status = 'approved', reviewed_at = now() WHERE id = req.id;
  RETURN new_balance;
END; $$;
REVOKE ALL ON FUNCTION public.approve_manual_deposit(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_manual_deposit(UUID) TO service_role;