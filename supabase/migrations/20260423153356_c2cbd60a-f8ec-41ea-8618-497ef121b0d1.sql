-- Anti-doublon : numéro de table et token QR uniques
ALTER TABLE public.tables
  ADD CONSTRAINT tables_number_unique UNIQUE (number);

ALTER TABLE public.tables
  ADD CONSTRAINT tables_qr_token_unique UNIQUE (qr_token);

-- Horodatage du dernier scan client (pour passer la carte en "Client connecté")
ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS last_scan_at timestamptz;

-- Permettre aux clients (anon) d'horodater leur propre scan UNIQUEMENT
-- s'ils sont bien le guest assigné à la table. Ne touche à rien d'autre.
CREATE OR REPLACE FUNCTION public.touch_table_scan(_qr_token text, _guest_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.tables
     SET last_scan_at = now()
   WHERE qr_token = _qr_token
     AND assigned_guest_id = _guest_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.touch_table_scan(text, text) TO anon, authenticated;