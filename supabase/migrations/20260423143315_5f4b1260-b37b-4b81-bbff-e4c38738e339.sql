-- Trigger : valide qu'une commande invité ne peut être créée que sur une table
-- effectivement assignée par le staff au même guest_id.
CREATE OR REPLACE FUNCTION public.check_order_table_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assigned_guest text;
  v_assigned_at    timestamptz;
BEGIN
  -- N'applique le verrou qu'aux commandes invité (guest_id) avec une table.
  -- Les commandes "user_id" authentifiées ou les insertions admin passent.
  IF NEW.guest_id IS NULL OR NEW.table_number IS NULL THEN
    RETURN NEW;
  END IF;

  -- Bypass si l'auteur est un admin (création manuelle depuis le back-office).
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  SELECT assigned_guest_id, assigned_at
    INTO v_assigned_guest, v_assigned_at
  FROM public.tables
  WHERE number = NEW.table_number
  LIMIT 1;

  IF v_assigned_at IS NULL OR v_assigned_guest IS NULL THEN
    RAISE EXCEPTION 'Table % non assignée. Présentez-vous à l''accueil pour obtenir votre accès.', NEW.table_number
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_assigned_guest <> NEW.guest_id THEN
    RAISE EXCEPTION 'Session invalide pour la table %. Demandez un nouveau QR à l''accueil.', NEW.table_number
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_order_table_assignment ON public.orders;
CREATE TRIGGER trg_check_order_table_assignment
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.check_order_table_assignment();