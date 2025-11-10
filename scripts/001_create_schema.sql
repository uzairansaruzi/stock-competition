-- Admin Competition Configuration
CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT '2026-01-01',
  end_date DATE NOT NULL DEFAULT '2026-12-31',
  entry_price_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Participants/Users
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Stock Picks (each participant picks 10 stocks)
CREATE TABLE IF NOT EXISTS public.stock_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  entry_price DECIMAL(10, 2),
  quantity INTEGER DEFAULT 1000, -- $1000 per stock / entry_price
  picked_at TIMESTAMP DEFAULT now()
);

-- Stock Price History (cached current prices)
CREATE TABLE IF NOT EXISTS public.stock_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  last_updated TIMESTAMP DEFAULT now(),
  UNIQUE(ticker)
);

-- Enable RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "competitions_select" ON public.competitions;
DROP POLICY IF EXISTS "competitions_insert" ON public.competitions;
DROP POLICY IF EXISTS "competitions_update" ON public.competitions;
DROP POLICY IF EXISTS "participants_select_own_competition" ON public.participants;
DROP POLICY IF EXISTS "participants_insert" ON public.participants;
DROP POLICY IF EXISTS "participants_update_own" ON public.participants;
DROP POLICY IF EXISTS "stock_picks_select_own" ON public.stock_picks;
DROP POLICY IF EXISTS "stock_picks_insert_own" ON public.stock_picks;
DROP POLICY IF EXISTS "stock_picks_update_own" ON public.stock_picks;
DROP POLICY IF EXISTS "stock_picks_delete_own" ON public.stock_picks;
DROP POLICY IF EXISTS "stock_prices_select" ON public.stock_prices;

-- Updated RLS policies to allow authenticated users to manage competitions and their data
-- Competitions: Authenticated users (admins) can insert/update/select
CREATE POLICY "competitions_select" ON public.competitions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "competitions_insert" ON public.competitions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "competitions_update" ON public.competitions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Participants: Users can view all participants, insert new ones
CREATE POLICY "participants_select" ON public.participants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "participants_insert" ON public.participants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "participants_update_own" ON public.participants
  FOR UPDATE USING (auth.uid() = id);

-- Stock Picks: Users can only see their own picks, but insert/update/delete their own
CREATE POLICY "stock_picks_select_own" ON public.stock_picks
  FOR SELECT USING (auth.uid() = participant_id OR auth.role() = 'authenticated');

CREATE POLICY "stock_picks_insert_own" ON public.stock_picks
  FOR INSERT WITH CHECK (auth.uid() = participant_id);

CREATE POLICY "stock_picks_update_own" ON public.stock_picks
  FOR UPDATE USING (auth.uid() = participant_id);

CREATE POLICY "stock_picks_delete_own" ON public.stock_picks
  FOR DELETE USING (auth.uid() = participant_id);

-- Stock Prices: Everyone can read
CREATE POLICY "stock_prices_select" ON public.stock_prices
  FOR SELECT USING (true);
