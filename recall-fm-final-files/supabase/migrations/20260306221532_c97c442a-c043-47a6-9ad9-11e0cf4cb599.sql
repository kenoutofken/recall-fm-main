
ALTER TABLE public.memories ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Allow anyone authenticated to read public memories
CREATE POLICY "Anyone can view public memories"
ON public.memories FOR SELECT
TO authenticated
USING (is_public = true);
