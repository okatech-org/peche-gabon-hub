-- Ajouter user_id à la table armements pour lier un armement à un utilisateur
ALTER TABLE public.armements ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_armements_user_id ON public.armements(user_id);

-- Mettre à jour les RLS policies pour les armements
DROP POLICY IF EXISTS "Admins et direction peuvent gérer armements" ON public.armements;
DROP POLICY IF EXISTS "Lecture armements pour rôles autorisés" ON public.armements;
DROP POLICY IF EXISTS "Armateurs peuvent voir leur armement" ON public.armements;
DROP POLICY IF EXISTS "Armateurs peuvent mettre à jour leur armement" ON public.armements;
DROP POLICY IF EXISTS "Admins peuvent créer armements" ON public.armements;

-- Les armateurs peuvent voir leur propre armement
CREATE POLICY "Armateurs peuvent voir leur armement"
ON public.armements
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

-- Les armateurs peuvent mettre à jour leur armement
CREATE POLICY "Armateurs peuvent mettre à jour leur armement"
ON public.armements
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'direction_centrale'::app_role))
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'direction_centrale'::app_role));

-- Les admins peuvent créer des armements
CREATE POLICY "Admins peuvent créer armements"
ON public.armements
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'direction_centrale'::app_role));

-- Mettre à jour les RLS policies pour les navires
DROP POLICY IF EXISTS "Admins et direction peuvent gérer navires" ON public.navires;
DROP POLICY IF EXISTS "Lecture navires pour rôles autorisés" ON public.navires;
DROP POLICY IF EXISTS "Armateurs peuvent voir leurs navires" ON public.navires;
DROP POLICY IF EXISTS "Armateurs peuvent gérer leurs navires" ON public.navires;

-- Les armateurs peuvent voir leurs navires
CREATE POLICY "Armateurs peuvent voir leurs navires"
ON public.navires
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM armements WHERE armements.id = navires.armement_id AND armements.user_id = auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'observateur_pi'::app_role) OR
  has_role(auth.uid(), 'inspecteur'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

-- Les armateurs peuvent gérer leurs navires
CREATE POLICY "Armateurs peuvent gérer leurs navires"
ON public.navires
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM armements WHERE armements.id = navires.armement_id AND armements.user_id = auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM armements WHERE armements.id = navires.armement_id AND armements.user_id = auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role)
);

-- Mettre à jour les RLS policies pour les marées industrielles
DROP POLICY IF EXISTS "Gestion marées industrielles" ON public.marees_industrielles;
DROP POLICY IF EXISTS "Lecture marées industrielles" ON public.marees_industrielles;
DROP POLICY IF EXISTS "Armateurs peuvent voir leurs marées" ON public.marees_industrielles;
DROP POLICY IF EXISTS "Armateurs peuvent gérer leurs marées" ON public.marees_industrielles;

-- Les armateurs peuvent voir les marées de leurs navires
CREATE POLICY "Armateurs peuvent voir leurs marées"
ON public.marees_industrielles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM navires n
    JOIN armements a ON n.armement_id = a.id
    WHERE n.id = marees_industrielles.navire_id AND a.user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'ministre'::app_role) OR
  has_role(auth.uid(), 'observateur_pi'::app_role) OR
  has_role(auth.uid(), 'analyste'::app_role)
);

-- Les armateurs peuvent déclarer des marées pour leurs navires
CREATE POLICY "Armateurs peuvent gérer leurs marées"
ON public.marees_industrielles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM navires n
    JOIN armements a ON n.armement_id = a.id
    WHERE n.id = marees_industrielles.navire_id AND a.user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'observateur_pi'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM navires n
    JOIN armements a ON n.armement_id = a.id
    WHERE n.id = marees_industrielles.navire_id AND a.user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'direction_centrale'::app_role) OR
  has_role(auth.uid(), 'observateur_pi'::app_role)
);