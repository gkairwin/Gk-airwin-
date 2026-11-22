ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE DEFAULT upper(substr(md5(gen_random_uuid()::text),1,8));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;
UPDATE public.profiles SET referral_code = upper(substr(md5(gen_random_uuid()::text),1,8)) WHERE referral_code IS NULL;

CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  source text NOT NULL,
  source_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('signup_bonus','commission')),
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id, kind)
);
GRANT SELECT ON public.referral_rewards TO authenticated;
GRANT ALL ON public.referral_rewards TO service_role;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY referral_rewards_own ON public.referral_rewards FOR SELECT TO authenticated USING (referrer_id = auth.uid());
CREATE UNIQUE INDEX referral_signup_once ON public.referral_rewards(referred_id) WHERE kind = 'signup_bonus';

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE ref uuid;
BEGIN
  SELECT id INTO ref FROM public.profiles WHERE referral_code = upper(nullif(trim(NEW.raw_user_meta_data->>'ref'),'')) LIMIT 1;
  INSERT INTO public.profiles (id, email, phone, balance, country_code, referred_by)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'phone', 0, NEW.raw_user_meta_data->>'country_code', CASE WHEN ref = NEW.id THEN NULL ELSE ref END)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.award_referral(_referred uuid, _source text, _source_id text, _amount numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE ref uuid; got int;
BEGIN
  SELECT referred_by INTO ref FROM public.profiles WHERE id = _referred;
  IF ref IS NULL OR ref = _referred OR coalesce(_amount,0) <= 0 THEN RETURN; END IF;
  INSERT INTO public.referral_rewards(referrer_id, referred_id, source, source_id, kind, amount)
  VALUES (ref, _referred, _source, _source_id, 'signup_bonus', 50) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS got = ROW_COUNT;
  IF got > 0 THEN UPDATE public.profiles SET balance = balance + 50 WHERE id = ref; END IF;
  INSERT INTO public.referral_rewards(referrer_id, referred_id, source, source_id, kind, amount)
  VALUES (ref, _referred, _source, _source_id, 'commission', round(_amount * 0.10, 2)) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS got = ROW_COUNT;
  IF got > 0 THEN UPDATE public.profiles SET balance = balance + round(_amount * 0.10, 2) WHERE id = ref; END IF;
END $$;
REVOKE ALL ON FUNCTION public.award_referral(uuid,text,text,numeric) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.referral_on_credit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_TABLE_NAME = 'manual_deposit_requests' THEN
    IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN PERFORM public.award_referral(NEW.user_id, TG_TABLE_NAME, NEW.id::text, NEW.amount); END IF;
  ELSIF NEW.credited AND NOT coalesce(OLD.credited,false) THEN
    PERFORM public.award_referral(NEW.user_id, TG_TABLE_NAME, NEW.id::text, NEW.amount);
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.referral_on_credit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER referral_deposits AFTER UPDATE ON public.deposits FOR EACH ROW EXECUTE FUNCTION public.referral_on_credit();
CREATE TRIGGER referral_crypto AFTER UPDATE ON public.crypto_deposits FOR EACH ROW EXECUTE FUNCTION public.referral_on_credit();
CREATE TRIGGER referral_manual AFTER UPDATE ON public.manual_deposit_requests FOR EACH ROW EXECUTE FUNCTION public.referral_on_credit();