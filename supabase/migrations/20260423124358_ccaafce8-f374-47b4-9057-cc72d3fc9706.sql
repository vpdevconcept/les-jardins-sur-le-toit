-- 1. Make user_id nullable + add guest fields
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_token text;
CREATE INDEX IF NOT EXISTS idx_orders_guest_id ON public.orders(guest_id);

-- 2. Drop old auth-only policies on orders
DROP POLICY IF EXISTS orders_client_insert_own ON public.orders;
DROP POLICY IF EXISTS orders_client_view_own ON public.orders;

-- 3. New policies allowing anonymous guests
CREATE POLICY orders_anyone_insert ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL AND guest_id IS NOT NULL)
    OR (auth.uid() = user_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY orders_view ON public.orders
  FOR SELECT TO anon, authenticated
  USING (
    guest_id IS NOT NULL
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Update order_items policies for guest support
DROP POLICY IF EXISTS order_items_client_insert ON public.order_items;
DROP POLICY IF EXISTS order_items_view ON public.order_items;

CREATE POLICY order_items_anyone_insert ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          o.guest_id IS NOT NULL
          OR o.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY order_items_view ON public.order_items
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          o.guest_id IS NOT NULL
          OR o.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'staff')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- 5. Anti-spam trigger : 1 commande active max par guest_id
CREATE OR REPLACE FUNCTION public.check_guest_active_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.guest_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.orders
      WHERE guest_id = NEW.guest_id
        AND status <> 'recupere'
        AND id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'Une commande est déjà en cours pour cet appareil. Merci de patienter.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_guest_active_order ON public.orders;
CREATE TRIGGER trg_check_guest_active_order
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_guest_active_order();

-- 6. Realtime
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;