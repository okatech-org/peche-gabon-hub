-- Table pour la base de connaissance alimentée par les conversations
CREATE TABLE IF NOT EXISTS public.knowledge_base_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  contenu_synthetise TEXT NOT NULL,
  themes TEXT[] DEFAULT '{}',
  mots_cles TEXT[] DEFAULT '{}',
  conversations_sources UUID[] DEFAULT '{}',
  nb_references INTEGER DEFAULT 1,
  derniere_mise_a_jour TIMESTAMP WITH TIME ZONE DEFAULT now(),
  score_pertinence NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_knowledge_themes ON public.knowledge_base_entries USING GIN(themes);
CREATE INDEX IF NOT EXISTS idx_knowledge_mots_cles ON public.knowledge_base_entries USING GIN(mots_cles);
CREATE INDEX IF NOT EXISTS idx_knowledge_score ON public.knowledge_base_entries(score_pertinence DESC);

-- RLS pour les admins et ministre
ALTER TABLE public.knowledge_base_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture pour ministre et admin"
  ON public.knowledge_base_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('ministre', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Insertion système uniquement"
  ON public.knowledge_base_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_knowledge_entry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.derniere_mise_a_jour = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_timestamp
  BEFORE UPDATE ON public.knowledge_base_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_entry_timestamp();