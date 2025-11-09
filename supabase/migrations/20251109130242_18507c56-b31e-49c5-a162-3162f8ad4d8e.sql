-- Ajouter la colonne tags à la table conversations_iasted
ALTER TABLE public.conversations_iasted 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Créer un index GIN pour la recherche par tags
CREATE INDEX IF NOT EXISTS idx_conversations_iasted_tags 
ON public.conversations_iasted USING GIN(tags);

-- Fonction pour mettre à jour les tags d'une conversation
CREATE OR REPLACE FUNCTION public.update_conversation_tags()
RETURNS TRIGGER AS $$
BEGIN
  -- Cette fonction sera appelée après l'ajout d'un message
  -- Les tags seront générés via l'edge function
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour déclencher l'analyse des tags (optionnel, les tags seront générés via l'edge function)
CREATE TRIGGER trigger_update_conversation_tags
AFTER INSERT ON public.messages_iasted
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_tags();