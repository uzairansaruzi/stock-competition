-- Add price_provider column to competitions table
ALTER TABLE public.competitions 
ADD COLUMN IF NOT EXISTS price_provider TEXT DEFAULT 'alpha_vantage';

-- Update existing rows to have a default provider
UPDATE public.competitions SET price_provider = 'alpha_vantage' WHERE price_provider IS NULL;
