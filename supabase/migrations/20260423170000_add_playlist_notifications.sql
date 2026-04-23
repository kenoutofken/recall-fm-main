-- Adds notifications when someone saves your memory's song to their playlist.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('memory_like', 'follow', 'playlist_add'));

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_source_table_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_source_table_check
  CHECK (source_table IN ('memory_likes', 'follows', 'playlist_songs'));

CREATE OR REPLACE FUNCTION public.create_playlist_add_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only notify when a playlist save points to a memory owned by someone else.
  IF NEW.memory_id IS NULL THEN
    RETURN NEW;
  END IF;

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
    'playlist_add',
    NEW.memory_id,
    'playlist_songs',
    NEW.id,
    NEW.created_at
  FROM public.memories
  WHERE memories.id = NEW.memory_id
    AND memories.user_id <> NEW.user_id
  ON CONFLICT (source_table, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_playlist_add_notification_trigger ON public.playlist_songs;
CREATE TRIGGER create_playlist_add_notification_trigger
  AFTER INSERT ON public.playlist_songs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_playlist_add_notification();

-- Backfill existing playlist saves tied to another user's memory.
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
  playlist_songs.user_id,
  'playlist_add',
  playlist_songs.memory_id,
  'playlist_songs',
  playlist_songs.id,
  playlist_songs.created_at
FROM public.playlist_songs
JOIN public.memories ON memories.id = playlist_songs.memory_id
WHERE playlist_songs.memory_id IS NOT NULL
  AND memories.user_id <> playlist_songs.user_id
ON CONFLICT (source_table, source_id) DO NOTHING;
