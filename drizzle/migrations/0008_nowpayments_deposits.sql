CREATE TABLE public.crypto_deposits (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id), request_id uuid NOT NULL UNIQUE,
 amount numeric NOT NULL CHECK (amount >= 100 AND amount <= 150000), payment_id text UNIQUE, pay_currency text NOT NULL, pay_address text, pay_amount numeric,
 status text NOT NULL DEFAULT 'creating', credited boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crypto_deposits TO authenticated;
GRANT ALL ON public.crypto_deposits TO service_role;
ALTER TABLE public.crypto_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_crypto_deposits ON public.crypto_deposits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.credit_crypto_deposit(p_id uuid, p_payment_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.crypto_deposits;
BEGIN
 SELECT * INTO d FROM public.crypto_deposits WHERE id=p_id AND payment_id=p_payment_id FOR UPDATE;
 IF d.id IS NULL THEN RAISE EXCEPTION 'Deposit not found'; END IF;
 IF d.credited THEN RETURN false; END IF;
 UPDATE public.profiles SET balance=balance+d.amount WHERE id=d.user_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
 UPDATE public.crypto_deposits SET credited=true,status='finished' WHERE id=d.id;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.credit_crypto_deposit(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.credit_crypto_deposit(uuid,text) TO service_role;