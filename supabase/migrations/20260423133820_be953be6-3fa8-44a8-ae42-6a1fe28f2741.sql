-- Add 'encaisse' final status to order lifecycle
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'encaisse';

-- Update guest active order check to allow new session after encaissement
CREATE OR REPLACE FUNCTION public.check_guest_active_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.guest_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.orders
      WHERE guest_id = NEW.guest_id
        AND status NOT IN ('recupere', 'encaisse')
        AND id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'Une commande est déjà en cours pour cet appareil. Merci de patienter.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;