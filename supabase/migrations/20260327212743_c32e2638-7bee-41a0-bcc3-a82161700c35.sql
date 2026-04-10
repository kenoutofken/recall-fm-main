
CREATE TABLE public.playlist_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  song_title TEXT NOT NULL,
  artist TEXT NOT NULL,
  memory_id UUID REFERENCES public.memories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playlist" ON public.playlist_songs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own playlist" ON public.playlist_songs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own playlist" ON public.playlist_songs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
