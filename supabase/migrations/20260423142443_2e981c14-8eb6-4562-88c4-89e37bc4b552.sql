-- Ajout des colonnes de session staff sur la table tables
ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_guest_id text,
  ADD COLUMN IF NOT EXISTS staff_note text;

-- Index pour retrouver rapidement une session staff par guest_id
CREATE INDEX IF NOT EXISTS idx_tables_assigned_guest_id
  ON public.tables (assigned_guest_id)
  WHERE assigned_guest_id IS NOT NULL;

-- Policy : permettre au staff (en plus de l'admin) de mettre à jour les tables
-- pour pouvoir assigner / libérer / faire tourner le qr_token
CREATE POLICY "tables_staff_update"
ON public.tables
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'staff'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'staff'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);