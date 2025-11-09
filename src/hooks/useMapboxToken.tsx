import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

/**
 * Hook pour récupérer le token Mapbox de manière sécurisée via l'edge function
 * Évite d'exposer le token dans le code frontend
 */
export function useMapboxToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data, error: fetchError } = await supabase.functions.invoke("get-mapbox-token");
        
        if (fetchError || !data?.token) {
          logger.error("Token Mapbox manquant", fetchError);
          if (mounted) {
            setError("Clé Mapbox introuvable. Vérifiez la configuration des secrets.");
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          setToken(data.token);
          setError(null);
          setIsLoading(false);
        }
      } catch (e) {
        logger.error("Erreur récupération token Mapbox:", e);
        if (mounted) {
          setError("Impossible de récupérer la clé Mapbox.");
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { token, isLoading, error };
}
