-- Activer REPLICA IDENTITY FULL pour capturer toutes les données lors des updates
ALTER TABLE public.taxes_captures REPLICA IDENTITY FULL;

-- Ajouter la table à la publication supabase_realtime pour activer le temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.taxes_captures;