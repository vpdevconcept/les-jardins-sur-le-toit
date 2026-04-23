
-- ============================================
-- 1. Categories table
-- ============================================
CREATE TABLE public.categories (
  id text PRIMARY KEY,
  label text NOT NULL,
  icon text NOT NULL DEFAULT '🍽️',
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
-- Auth write
CREATE POLICY "Auth insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update categories" ON public.categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete categories" ON public.categories FOR DELETE TO authenticated USING (true);

-- Seed categories from existing data
INSERT INTO public.categories (id, label, icon, description, sort_order) VALUES
  ('burgers', '🍔 Burgers', '🍔', 'Base Salade / Tomate / Oignons frits / Lentilles germées', 1),
  ('bowls', '🥗 Bowls', '🥗', 'Frais, complets et colorés', 2),
  ('boissons', '🥤 Boissons', '🥤', 'Jus frais, Aloès, Fermentations', 3);

-- ============================================
-- 2. Upgrade menu_items
-- ============================================

-- Add is_available
ALTER TABLE public.menu_items ADD COLUMN is_available boolean NOT NULL DEFAULT true;

-- Add updated_at
ALTER TABLE public.menu_items ADD COLUMN updated_at timestamptz DEFAULT now();

-- Add category_id FK (populate from existing category text column)
ALTER TABLE public.menu_items ADD COLUMN category_id text REFERENCES public.categories(id);
UPDATE public.menu_items SET category_id = category;

-- Now make it NOT NULL
ALTER TABLE public.menu_items ALTER COLUMN category_id SET NOT NULL;

-- Performance indexes
CREATE INDEX idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX idx_menu_items_sort_order ON public.menu_items(sort_order);
CREATE INDEX idx_menu_items_available ON public.menu_items(is_available);

-- Auth write policies
CREATE POLICY "Auth insert menu_items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update menu_items" ON public.menu_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete menu_items" ON public.menu_items FOR DELETE TO authenticated USING (true);

-- ============================================
-- 3. Upgrade locations
-- ============================================
ALTER TABLE public.locations ADD COLUMN updated_at timestamptz DEFAULT now();

-- Auth write policies
CREATE POLICY "Auth insert locations" ON public.locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update locations" ON public.locations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete locations" ON public.locations FOR DELETE TO authenticated USING (true);

-- ============================================
-- 4. Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. Enable Realtime on all tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
