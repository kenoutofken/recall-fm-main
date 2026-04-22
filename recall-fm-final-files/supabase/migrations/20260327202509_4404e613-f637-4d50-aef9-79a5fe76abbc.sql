
CREATE TABLE public.memory_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (memory_id, user_id)
);

ALTER TABLE public.memory_likes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see likes on public memories
CREATE POLICY "Anyone can view likes"
  ON public.memory_likes FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can like memories"
  ON public.memory_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own likes
CREATE POLICY "Users can unlike memories"
  ON public.memory_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
