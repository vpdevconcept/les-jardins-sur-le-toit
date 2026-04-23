-- Add display_order column for drag & drop persistence
ALTER TABLE public.tables
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Backfill from current table number so existing tables keep a sane order
UPDATE public.tables
SET display_order = number
WHERE display_order IS NULL;

-- Default to 0 for any future row (front-end will set proper value)
ALTER TABLE public.tables
ALTER COLUMN display_order SET DEFAULT 0,
ALTER COLUMN display_order SET NOT NULL;

-- Index for fast ORDER BY
CREATE INDEX IF NOT EXISTS idx_tables_display_order
ON public.tables (display_order);