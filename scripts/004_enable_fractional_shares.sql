-- Modify stock_picks table to support fractional shares
-- Change quantity from INTEGER to DECIMAL to store fractional shares
ALTER TABLE public.stock_picks 
ALTER COLUMN quantity TYPE DECIMAL(10, 4);

-- Update existing data: quantity should always equal 1000 / entry_price for $1000 per stock
UPDATE public.stock_picks 
SET quantity = CAST(1000.0 / NULLIF(entry_price, 0) AS DECIMAL(10, 4))
WHERE entry_price > 0;
