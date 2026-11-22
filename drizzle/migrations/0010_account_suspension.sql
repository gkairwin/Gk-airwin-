ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.block_suspended_bets() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.user_id AND suspended) THEN
    RAISE EXCEPTION 'account_suspended';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS bets_block_suspended ON public.bets;
CREATE TRIGGER bets_block_suspended BEFORE INSERT ON public.bets FOR EACH ROW EXECUTE FUNCTION public.block_suspended_bets();