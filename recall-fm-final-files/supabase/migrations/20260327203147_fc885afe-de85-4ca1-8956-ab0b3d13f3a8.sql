
-- Add image_url column to memories
ALTER TABLE public.memories ADD COLUMN image_url TEXT;

-- Create storage bucket for memory images
INSERT INTO storage.buckets (id, name, public)
VALUES ('memory-images', 'memory-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload memory images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'memory-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view memory images (public bucket)
CREATE POLICY "Anyone can view memory images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'memory-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own memory images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'memory-images' AND (storage.foldername(name))[1] = auth.uid()::text);
