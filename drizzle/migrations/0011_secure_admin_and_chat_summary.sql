CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role text NOT NULL CHECK (role IN ('admin')), UNIQUE (user_id, role));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_roles_read_own ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.admin_chat_summary() RETURNS TABLE(user_id uuid, last_body text, last_at timestamptz, unread bigint, awaiting_reply boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
WITH aggregate_messages AS (SELECT m.user_id, count(*) FILTER (WHERE m.sender='user' AND NOT m.read_by_admin) AS unread, max(m.created_at) FILTER (WHERE m.sender='user') AS last_user, max(m.created_at) FILTER (WHERE m.sender='admin') AS last_admin FROM public.chat_messages m GROUP BY m.user_id), latest AS (SELECT DISTINCT ON (m.user_id) m.user_id, m.body, m.created_at FROM public.chat_messages m ORDER BY m.user_id,m.created_at DESC,m.id DESC)
SELECT a.user_id,l.body,l.created_at,a.unread,coalesce(a.last_user > coalesce(a.last_admin,'-infinity'::timestamptz),false) FROM aggregate_messages a JOIN latest l USING(user_id) ORDER BY l.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.admin_chat_summary() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_chat_summary() TO service_role;