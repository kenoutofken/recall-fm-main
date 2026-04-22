ALTER TABLE public.memories
  ADD COLUMN location_lat DOUBLE PRECISION,
  ADD COLUMN location_lng DOUBLE PRECISION,
  ADD COLUMN location_place_id TEXT;
