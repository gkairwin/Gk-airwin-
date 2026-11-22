CREATE TABLE public.chat_translations (message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE, target_language text NOT NULL CHECK (target_language IN ('en','fr','ar','pt','es','sw','hi','ur','am','ti','so','rw','rn','mg')), user_id uuid NOT NULL, translated_body text, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','failed')), error text, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(message_id,target_language));
GRANT SELECT ON public.chat_translations TO authenticated;
GRANT ALL ON public.chat_translations TO service_role;
ALTER TABLE public.chat_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY translations_read ON public.chat_translations FOR SELECT TO authenticated USING ((user_id=auth.uid() OR EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role='admin')) AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND NOT p.suspended));
CREATE INDEX chat_translations_user_created ON public.chat_translations(user_id,created_at);
CREATE TABLE public.chat_translation_service (id boolean PRIMARY KEY DEFAULT true CHECK(id), paused boolean NOT NULL DEFAULT false, error text, http_status integer);
GRANT ALL ON public.chat_translation_service TO service_role;
ALTER TABLE public.chat_translation_service ENABLE ROW LEVEL SECURITY;