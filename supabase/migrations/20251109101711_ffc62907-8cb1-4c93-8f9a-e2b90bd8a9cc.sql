-- Créer une table pour les préférences utilisateur
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'fr',
  theme TEXT NOT NULL DEFAULT 'light',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Activer RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres préférences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leurs propres préférences
CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent mettre à jour leurs propres préférences
CREATE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres préférences
CREATE POLICY "Users can delete their own preferences"
ON public.user_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement les préférences lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, language, theme)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'language', 'fr'),
    COALESCE(new.raw_user_meta_data->>'theme', 'light')
  );
  RETURN new;
END;
$$;

-- Trigger pour créer les préférences à chaque nouvel utilisateur
CREATE TRIGGER on_auth_user_created_preferences
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_preferences();