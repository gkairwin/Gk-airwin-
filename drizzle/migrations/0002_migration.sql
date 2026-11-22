CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE ph text := NEW.raw_user_meta_data ->> 'phone'; legacy numeric := 0;
BEGIN
  IF ph ~ '^254[17][0-9]{8}$' THEN
    SELECT COALESCE(sum(balance),0) INTO legacy FROM public.profiles WHERE phone = '0' || substr(ph,4);
    UPDATE public.profiles SET balance = 0 WHERE phone = '0' || substr(ph,4);
  END IF;
  INSERT INTO public.profiles (id, email, phone, balance) VALUES (NEW.id, NEW.email, ph, legacy)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;