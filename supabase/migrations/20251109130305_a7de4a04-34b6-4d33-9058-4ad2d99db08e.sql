-- Corriger la fonction avec SET search_path
DROP FUNCTION IF EXISTS public.update_conversation_tags() CASCADE;

CREATE OR REPLACE FUNCTION public.update_conversation_tags()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cette fonction sera appelée après l'ajout d'un message
  -- Les tags seront générés via l'edge function
  RETURN NEW;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_update_conversation_tags ON public.messages_iasted;

CREATE TRIGGER trigger_update_conversation_tags
AFTER INSERT ON public.messages_iasted
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_tags();