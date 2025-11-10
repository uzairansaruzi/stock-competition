-- Add refresh_interval to competitions table
ALTER TABLE public.competitions
ADD COLUMN IF NOT EXISTS refresh_interval INTEGER DEFAULT 60;
