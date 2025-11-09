-- Drop le trigger d'abord, puis la fonction, puis les recréer avec search_path
DROP TRIGGER IF EXISTS update_knowledge_timestamp ON public.knowledge_base_entries;
DROP FUNCTION IF EXISTS update_knowledge_entry_timestamp();

CREATE OR REPLACE FUNCTION update_knowledge_entry_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.derniere_mise_a_jour = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_knowledge_timestamp
  BEFORE UPDATE ON public.knowledge_base_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_entry_timestamp();