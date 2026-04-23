
-- ============================================
-- Table: locations
-- ============================================
CREATE TABLE public.locations (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  postal_code text NOT NULL,
  city text NOT NULL,
  phone text NOT NULL,
  whatsapp text NOT NULL,
  hours jsonb NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  delivery_enabled boolean DEFAULT false,
  delivery_radius integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read locations" ON public.locations
  FOR SELECT USING (true);

-- ============================================
-- Table: menu_items
-- ============================================
CREATE TABLE public.menu_items (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  price numeric(6,2) NOT NULL,
  category text NOT NULL,
  badges text[] DEFAULT '{}',
  is_vegan boolean DEFAULT false,
  is_gluten_free boolean DEFAULT false,
  is_pei boolean DEFAULT false,
  kcal integer,
  allergens text[] DEFAULT '{}',
  energy jsonb DEFAULT '[]',
  options jsonb DEFAULT '[]',
  upsell_ids text[] DEFAULT '{}',
  available_at text[] DEFAULT '{}',
  image_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read menu_items" ON public.menu_items
  FOR SELECT USING (true);

-- ============================================
-- Seed: locations
-- ============================================
INSERT INTO public.locations (id, name, address, postal_code, city, phone, whatsapp, hours, lat, lng, delivery_enabled) VALUES
('saint-leu', 'Saint-Leu', '168 rue du Général Lambert', '97436', 'Saint-Leu', '0262 00 00 01', '262692000001',
 '{"lun":"fermé","mar":"11:00-21:00","mer":"11:00-21:00","jeu":"11:00-21:00","ven":"11:00-21:00","sam":"11:00-21:00","dim":"11:00-21:00"}'::jsonb,
 -21.1667, 55.2833, false),
('la-saline', 'La Saline', '69 route du Trou d''Eau', '97434', 'La Saline', '0262 00 00 02', '262692000002',
 '{"lun":"fermé","mar":"11:00-21:00","mer":"11:00-21:00","jeu":"11:00-21:00","ven":"11:00-21:00","sam":"11:00-21:00","dim":"11:00-21:00"}'::jsonb,
 -21.0727, 55.2367, false);

-- ============================================
-- Seed: menu_items
-- ============================================
INSERT INTO public.menu_items (id, name, description, price, category, badges, is_vegan, is_gluten_free, is_pei, kcal, allergens, energy, options, upsell_ids, sort_order) VALUES
-- Burgers
('piton-cabri', 'Piton Cabri', 'Bun artisanal, Beignets songe, Chèvre frais péi. Base Salade, Tomate, Oignons frits, Lentilles germées.', 13.50, 'burgers', '{"Best-Seller"}', false, false, true, 520, '{"Gluten","Lactose"}',
 '[{"label":"Protéines","value":65},{"label":"Fibres","value":70},{"label":"Vitamines","value":80}]'::jsonb,
 '[{"id":"supplement-piton","label":"Supplément","type":"multiple","choices":[{"id":"extra-fromage","label":"Extra Chèvre","priceExtra":1.5},{"id":"extra-avocat","label":"Avocat","priceExtra":2}]}]'::jsonb,
 '{"aloes-combo","green-coco"}', 1),

('jack-sparrow', 'Jack Sparrow', 'Bun artisanal, Ti Jack, Sauce maison. Base Salade, Tomate, Oignons frits, Lentilles germées.', 13.50, 'burgers', '{}', true, false, false, 480, '{"Gluten"}',
 '[{"label":"Protéines","value":50},{"label":"Fibres","value":85},{"label":"Vitamines","value":75}]'::jsonb,
 '[{"id":"supplement-jack","label":"Supplément","type":"multiple","choices":[{"id":"extra-avocat","label":"Avocat","priceExtra":2}]}]'::jsonb,
 '{"aloes-combo","afrikana"}', 2),

('big-green', 'Big Green', 'Spiruline, Avocat, Steak végé maison. Base Salade, Tomate, Oignons frits, Lentilles germées.', 14.50, 'burgers', '{"Best-Seller"}', false, true, false, 550, '{}',
 '[{"label":"Protéines","value":80},{"label":"Fibres","value":60},{"label":"Vitamines","value":90}]'::jsonb,
 '[{"id":"supplement-big","label":"Supplément","type":"multiple","choices":[{"id":"extra-avocat","label":"Avocat","priceExtra":2},{"id":"extra-spiruline","label":"Double Spiruline","priceExtra":1.5}]}]'::jsonb,
 '{"green-coco","kombucha"}', 3),

('bebour', 'Bébour', 'Falafel, Poivrons, Champignons frais. Base Salade, Tomate, Oignons frits, Lentilles germées.', 13.50, 'burgers', '{}', true, false, false, 460, '{"Gluten"}',
 '[{"label":"Protéines","value":55},{"label":"Fibres","value":75},{"label":"Vitamines","value":70}]'::jsonb,
 '[]'::jsonb,
 '{"aloes-combo","kefir"}', 4),

-- Bowls
('cocotte', 'Cocotte', 'Oeuf parfait, Frites de bananes vertes, Crémeux curcuma.', 12.00, 'bowls', '{}', false, true, false, 420, '{"Oeufs"}',
 '[{"label":"Protéines","value":60},{"label":"Fibres","value":65},{"label":"Vitamines","value":85}]'::jsonb,
 '[]'::jsonb, '{}', 1),

('vegan-bowl', 'Végan', 'Beignets songe, Houmous d''Azuki.', 12.00, 'bowls', '{}', true, false, true, 380, '{"Gluten"}',
 '[{"label":"Protéines","value":45},{"label":"Fibres","value":90},{"label":"Vitamines","value":80}]'::jsonb,
 '[]'::jsonb, '{}', 2),

('bien-manze', 'Bien Manzé', 'Falafels, Quinoa, Légumes du jour.', 12.00, 'bowls', '{}', true, false, false, 400, '{"Gluten"}',
 '[{"label":"Protéines","value":70},{"label":"Fibres","value":80},{"label":"Vitamines","value":85}]'::jsonb,
 '[{"id":"base-bowl","label":"Base","type":"single","required":true,"choices":[{"id":"quinoa","label":"Quinoa","priceExtra":0},{"id":"riz","label":"Riz complet","priceExtra":0}]}]'::jsonb,
 '{}', 3),

-- Boissons
('green-coco', 'Green Coco', 'Eau de coco fraîche, spiruline, menthe.', 4.50, 'boissons', '{"Best-Seller"}', false, false, false, 85, '{}',
 '[{"label":"Protéines","value":15},{"label":"Fibres","value":20},{"label":"Vitamines","value":95}]'::jsonb,
 '[]'::jsonb, '{}', 1),

('afrikana', 'Afrikana', 'Jus de baobab, gingembre, citron vert.', 4.50, 'boissons', '{}', false, false, true, 90, '{}',
 '[{"label":"Protéines","value":10},{"label":"Fibres","value":30},{"label":"Vitamines","value":90}]'::jsonb,
 '[]'::jsonb, '{}', 2),

('anakao', 'Anakao', 'Mangue, passion, lait de coco.', 4.50, 'boissons', '{}', false, false, false, 110, '{"Fruits à coque"}',
 '[{"label":"Protéines","value":10},{"label":"Fibres","value":25},{"label":"Vitamines","value":85}]'::jsonb,
 '[]'::jsonb, '{}', 3),

('aloes-combo', 'Aloès Combo', 'Aloès vera, citron, miel péi.', 4.00, 'boissons', '{}', false, false, true, 65, '{}',
 '[{"label":"Protéines","value":5},{"label":"Fibres","value":40},{"label":"Vitamines","value":80}]'::jsonb,
 '[]'::jsonb, '{}', 4),

('aloes-flower', 'Aloès Flower', 'Aloès vera, fleur d''hibiscus.', 4.00, 'boissons', '{}', false, false, false, 60, '{}',
 '[{"label":"Protéines","value":5},{"label":"Fibres","value":35},{"label":"Vitamines","value":75}]'::jsonb,
 '[]'::jsonb, '{}', 5),

('aloes-green', 'Aloès Green', 'Aloès vera, menthe, concombre.', 4.00, 'boissons', '{}', false, false, false, 55, '{}',
 '[{"label":"Protéines","value":5},{"label":"Fibres","value":30},{"label":"Vitamines","value":85}]'::jsonb,
 '[]'::jsonb, '{}', 6),

('aloes-vaa', 'Aloès Va''a', 'Aloès vera, ananas, vanille bourbon.', 4.00, 'boissons', '{}', false, false, false, 70, '{}',
 '[{"label":"Protéines","value":5},{"label":"Fibres","value":30},{"label":"Vitamines","value":80}]'::jsonb,
 '[]'::jsonb, '{}', 7),

('kombucha', 'Kombucha', 'Thé fermenté artisanal, saveur du jour.', 4.50, 'boissons', '{"Fermenté"}', false, false, false, 45, '{}',
 '[{"label":"Protéines","value":5},{"label":"Fibres","value":50},{"label":"Vitamines","value":70}]'::jsonb,
 '[]'::jsonb, '{}', 8),

('kefir', 'Kéfir', 'Boisson fermentée de fruits frais.', 4.50, 'boissons', '{"Fermenté"}', false, false, false, 50, '{}',
 '[{"label":"Protéines","value":10},{"label":"Fibres","value":45},{"label":"Vitamines","value":75}]'::jsonb,
 '[]'::jsonb, '{}', 9),

('ginger-ale', 'Ginger Ale', 'Gingembre frais, citron, pétillant naturel.', 4.00, 'boissons', '{"Fermenté"}', false, false, false, 55, '{}',
 '[{"label":"Protéines","value":5},{"label":"Fibres","value":20},{"label":"Vitamines","value":65}]'::jsonb,
 '[]'::jsonb, '{}', 10);
