
-- Create role system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can see roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Drop old permissive write policies and replace with admin-only
-- menu_items
DROP POLICY IF EXISTS "Auth insert menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Auth update menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Auth delete menu_items" ON public.menu_items;

CREATE POLICY "Admin insert menu_items" ON public.menu_items FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update menu_items" ON public.menu_items FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete menu_items" ON public.menu_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- locations
DROP POLICY IF EXISTS "Auth insert locations" ON public.locations;
DROP POLICY IF EXISTS "Auth update locations" ON public.locations;
DROP POLICY IF EXISTS "Auth delete locations" ON public.locations;

CREATE POLICY "Admin insert locations" ON public.locations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update locations" ON public.locations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete locations" ON public.locations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- categories
DROP POLICY IF EXISTS "Auth insert categories" ON public.categories;
DROP POLICY IF EXISTS "Auth update categories" ON public.categories;
DROP POLICY IF EXISTS "Auth delete categories" ON public.categories;

CREATE POLICY "Admin insert categories" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update categories" ON public.categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete categories" ON public.categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
