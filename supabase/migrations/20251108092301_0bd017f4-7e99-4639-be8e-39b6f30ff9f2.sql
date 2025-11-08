-- Corriger la fonction calculer_note_globale avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.calculer_note_globale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.note_globale = (NEW.note_pedagogie + NEW.note_expertise + NEW.note_communication + NEW.note_organisation) / 4.0;
  RETURN NEW;
END;
$$;