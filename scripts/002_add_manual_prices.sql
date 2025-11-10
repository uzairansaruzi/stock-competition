-- Create table for manually set entry prices
CREATE TABLE IF NOT EXISTS public.manual_entry_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(competition_id, ticker)
);

-- Enable RLS
ALTER TABLE public.manual_entry_prices ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage manual prices
CREATE POLICY "manual_entry_prices_select" ON public.manual_entry_prices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "manual_entry_prices_insert" ON public.manual_entry_prices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "manual_entry_prices_update" ON public.manual_entry_prices
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "manual_entry_prices_delete" ON public.manual_entry_prices
  FOR DELETE USING (auth.role() = 'authenticated');
