CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('memory_like', 'follow')),
  memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL CHECK (source_table IN ('memory_likes', 'follows')),
  source_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT notifications_unique_source UNIQUE (source_table, source_id)
);

CREATE INDEX IF NOT EXISTS notifications_user_created_at_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_read_at_idx
  ON public.notifications (user_id, read_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_memory_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    actor_id,
    type,
    memory_id,
    source_table,
    source_id,
    created_at
  )
  SELECT
    memories.user_id,
    NEW.user_id,
    'memory_like',
    NEW.memory_id,
    'memory_likes',
    NEW.id,
    NEW.created_at
  FROM public.memories
  WHERE memories.id = NEW.memory_id
    AND memories.user_id <> NEW.user_id
  ON CONFLICT (source_table, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.following_id = NEW.follower_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    actor_id,
    type,
    source_table,
    source_id,
    created_at
  )
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    'follows',
    NEW.id,
    NEW.created_at
  )
  ON CONFLICT (source_table, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_memory_like_notification_trigger ON public.memory_likes;
CREATE TRIGGER create_memory_like_notification_trigger
  AFTER INSERT ON public.memory_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_memory_like_notification();

DROP TRIGGER IF EXISTS create_follow_notification_trigger ON public.follows;
CREATE TRIGGER create_follow_notification_trigger
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.create_follow_notification();

INSERT INTO public.notifications (
  user_id,
  actor_id,
  type,
  memory_id,
  source_table,
  source_id,
  created_at
)
SELECT
  memories.user_id,
  memory_likes.user_id,
  'memory_like',
  memory_likes.memory_id,
  'memory_likes',
  memory_likes.id,
  memory_likes.created_at
FROM public.memory_likes
JOIN public.memories ON memories.id = memory_likes.memory_id
WHERE memories.user_id <> memory_likes.user_id
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (
  user_id,
  actor_id,
  type,
  source_table,
  source_id,
  created_at
)
SELECT
  follows.following_id,
  follows.follower_id,
  'follow',
  'follows',
  follows.id,
  follows.created_at
FROM public.follows
WHERE follows.following_id <> follows.follower_id
ON CONFLICT (source_table, source_id) DO NOTHING;
