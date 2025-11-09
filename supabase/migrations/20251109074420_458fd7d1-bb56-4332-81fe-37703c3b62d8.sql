-- Mettre à jour les RLS policies pour captures_industrielles_detail
DROP POLICY IF EXISTS "Gestion captures industrielles détail" ON public.captures_industrielles_detail;
DROP POLICY IF EXISTS "Lecture captures industrielles détail" ON public.captures_industrielles_detail;

-- Les armateurs peuvent voir les captures détaillées de leurs navires
CREATE POLICY "Armateurs peuvent voir captures détaillées"
ON public.captures_industrielles_detail
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM marees_industrielles m
    JOIN navires n ON m.navire_id = n.id
    JOIN armements a ON n.armement_id = a.id
    WHERE m.id = captures_industrielles_detail.maree_id AND a.user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

-- Les armateurs peuvent gérer les captures détaillées de leurs navires
CREATE POLICY "Armateurs peuvent gérer captures détaillées"
ON public.captures_industrielles_detail
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM marees_industrielles m
    JOIN navires n ON m.navire_id = n.id
    JOIN armements a ON n.armement_id = a.id
    WHERE m.id = captures_industrielles_detail.maree_id AND a.user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'observateur_pi'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM marees_industrielles m
    JOIN navires n ON m.navire_id = n.id
    JOIN armements a ON n.armement_id = a.id
    WHERE m.id = captures_industrielles_detail.maree_id AND a.user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'observateur_pi'::app_role)
);