ALTER TABLE public.chat_messages DROP CONSTRAINT chat_messages_sender_check;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_check CHECK (sender IN ('user','admin','leo'));
ALTER TABLE public.chat_messages ADD COLUMN reply_to uuid REFERENCES public.chat_messages(id), ADD COLUMN ai_parts jsonb;
CREATE UNIQUE INDEX chat_leo_reply_once ON public.chat_messages(reply_to) WHERE sender='leo';
CREATE TABLE public.leo_conversations (user_id uuid PRIMARY KEY, lease_id uuid, lease_until timestamptz, failed_message uuid, error text);
GRANT ALL ON public.leo_conversations TO service_role;
ALTER TABLE public.leo_conversations ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.leo_service_state (id text PRIMARY KEY CHECK(id='leo'), paused boolean NOT NULL DEFAULT false, reason text, http_status integer, retry_at timestamptz, lease_id uuid, lease_until timestamptz);
GRANT ALL ON public.leo_service_state TO service_role;
ALTER TABLE public.leo_service_state ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.leo_claim(p_user uuid, p_lease uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE latest public.chat_messages; last_reply timestamptz; state public.leo_conversations;
BEGIN
 INSERT INTO leo_conversations(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
 SELECT * INTO state FROM leo_conversations WHERE user_id=p_user FOR UPDATE;
 IF state.lease_until>now() THEN RETURN NULL; END IF;
 SELECT * INTO latest FROM chat_messages WHERE user_id=p_user AND sender='user' ORDER BY created_at DESC,id DESC LIMIT 1;
 SELECT max(created_at) INTO last_reply FROM chat_messages WHERE user_id=p_user AND sender IN ('admin','leo');
 IF latest.id IS NULL OR latest.created_at<=coalesce(last_reply,'-infinity') OR state.failed_message=latest.id THEN RETURN NULL; END IF;
 UPDATE leo_conversations SET lease_id=p_lease,lease_until=now()+interval '10 minutes',error=NULL WHERE user_id=p_user;
 RETURN jsonb_build_object('messageId',latest.id,'dueAt',latest.created_at+interval '5 seconds');
END $$;
CREATE OR REPLACE FUNCTION public.leo_complete(p_user uuid,p_lease uuid,p_message uuid,p_body text,p_parts jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE state public.leo_conversations;
BEGIN
 SELECT * INTO state FROM leo_conversations WHERE user_id=p_user FOR UPDATE;
 IF state.lease_id IS DISTINCT FROM p_lease THEN RAISE EXCEPTION 'Reply claim expired'; END IF;
 IF NOT EXISTS(SELECT 1 FROM chat_messages WHERE user_id=p_user AND sender='admin' AND created_at>(SELECT created_at FROM chat_messages WHERE id=p_message AND user_id=p_user)) THEN
 INSERT INTO chat_messages(user_id,sender,body,read_by_admin,reply_to,ai_parts) VALUES(p_user,'leo',p_body,false,p_message,p_parts) ON CONFLICT DO NOTHING;
 END IF;
 UPDATE leo_conversations SET lease_id=NULL,lease_until=NULL,failed_message=NULL,error=NULL WHERE user_id=p_user;
END $$;
CREATE OR REPLACE FUNCTION public.leo_backlog_claim(p_lease uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE state public.leo_service_state;
BEGIN
 INSERT INTO leo_service_state(id) VALUES('leo') ON CONFLICT DO NOTHING;
 SELECT * INTO state FROM leo_service_state WHERE id='leo' FOR UPDATE;
 IF state.paused OR state.retry_at>now() OR state.lease_until>now() THEN RETURN false; END IF;
 UPDATE leo_service_state SET lease_id=p_lease,lease_until=now()+interval '10 minutes' WHERE id='leo';
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.leo_unanswered() RETURNS TABLE(user_id uuid) LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 SELECT m.user_id FROM chat_messages m GROUP BY m.user_id HAVING max(m.created_at) FILTER(WHERE m.sender='user')>coalesce(max(m.created_at) FILTER(WHERE m.sender IN('admin','leo')),'-infinity'::timestamptz) ORDER BY max(m.created_at) LIMIT 5;
$$;
REVOKE ALL ON FUNCTION public.leo_claim(uuid,uuid),public.leo_complete(uuid,uuid,uuid,text,jsonb),public.leo_backlog_claim(uuid),public.leo_unanswered() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.leo_claim(uuid,uuid),public.leo_complete(uuid,uuid,uuid,text,jsonb),public.leo_backlog_claim(uuid),public.leo_unanswered() TO service_role;