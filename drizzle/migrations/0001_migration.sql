-- merge legacy 07... profiles into the 2547... account the player actually logs in with
UPDATE public.profiles n SET balance = n.balance + o.balance
FROM public.profiles o
WHERE o.phone ~ '^0[17][0-9]{8}$' AND n.phone = '254' || substr(o.phone,2) AND o.balance > 0;
UPDATE public.profiles o SET balance = 0
WHERE o.phone ~ '^0[17][0-9]{8}$' AND EXISTS (SELECT 1 FROM public.profiles n WHERE n.phone = '254' || substr(o.phone,2));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE ph text := NEW.raw_user_meta_data ->> 'phone'; legacy numeric := 0;
BEGIN
  IF ph ~ '^254[17][0-9]{8}$' THEN
    UPDATE public.profiles SET balance = 0 WHERE phone = '0' || substr(ph,4) AND balance > 0
      RETURNING balance INTO legacy;
    SELECT COALESCE(sum(balance),0) INTO legacy FROM (SELECT 0 AS balance) x; -- placeholder reset
  END IF;
  INSERT INTO public.profiles (id, email, phone) VALUES (NEW.id, NEW.email, ph) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user','admin')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  read_by_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_user_idx ON public.chat_messages(user_id, created_at);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_select_own ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY chat_insert_own ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND sender = 'user' AND read_by_admin = false);
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;