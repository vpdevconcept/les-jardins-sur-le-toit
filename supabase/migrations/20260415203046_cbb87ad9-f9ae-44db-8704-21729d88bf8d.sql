
-- Assign admin role to both admin users
INSERT INTO public.user_roles (user_id, role) VALUES
  ('018fff42-ff17-4264-aa1d-742a8517f1d6', 'admin'),
  ('dd33549f-5971-4101-a0c6-15f2ef6b60b9', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix dangerous "Allow admin all" policies that have qual=true (allows everyone!)
-- Drop and recreate them properly

DROP POLICY IF EXISTS "Allow admin all" ON public.categories;
CREATE POLICY "Allow admin all" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow admin all" ON public.locations;
CREATE POLICY "Allow admin all" ON public.locations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow admin all" ON public.menu;
CREATE POLICY "Allow admin all" ON public.menu FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
