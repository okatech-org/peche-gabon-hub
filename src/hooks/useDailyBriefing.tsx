import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Briefing {
  id: string;
  date_briefing: string;
  titre: string;
  contenu_vocal: string;
  audio_url: string | null;
  points_cles: any;
  questions_strategiques: any;
  alertes_prioritaires: any;
  statistiques_resumees: any;
  statut: string;
  created_at: string;
}

export const useDailyBriefing = () => {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayBriefing();
  }, []);

  const loadTodayBriefing = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('briefings_quotidiens')
        .select('*')
        .eq('date_briefing', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setBriefing(data);
    } catch (error) {
      console.error('Erreur chargement briefing:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBriefing = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-briefing', {
        body: { generateAudio: true }
      });

      if (error) throw error;

      toast.success('Briefing généré avec succès');
      await loadTodayBriefing();
      return data;
    } catch (error) {
      console.error('Erreur génération briefing:', error);
      toast.error('Impossible de générer le briefing');
      throw error;
    }
  };

  const markAsRead = async () => {
    if (!briefing) return;

    try {
      const { error } = await supabase
        .from('briefings_quotidiens')
        .update({ statut: 'lu', lu_le: new Date().toISOString() })
        .eq('id', briefing.id);

      if (error) throw error;

      await loadTodayBriefing();
    } catch (error) {
      console.error('Erreur:', error);
      throw error;
    }
  };

  return {
    briefing,
    loading,
    loadTodayBriefing,
    generateBriefing,
    markAsRead
  };
};
