import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mic } from "lucide-react";
import { FocusSessionsPanel } from "./FocusSessionsPanel";

interface VoiceSettingsProps {
  onResumeSession?: (sessionId: string) => void;
}

export function VoiceSettings({ onResumeSession }: VoiceSettingsProps = {}) {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['voice-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .select('voice_focus_mode')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const updateFocusModeMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          voice_focus_mode: enabled
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-preferences'] });
      toast.success("Préférence mise à jour");
    },
    onError: (error) => {
      console.error('Error updating focus mode:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  });

  const focusModeEnabled = preferences?.voice_focus_mode || false;
  const isUpdating = updateFocusModeMutation.isPending;

  const updateFocusMode = (enabled: boolean) => {
    updateFocusModeMutation.mutate(enabled);
  };

  const handleResumeSession = (sessionId: string) => {
    if (onResumeSession) {
      onResumeSession(sessionId);
    } else {
      toast.info("Redirection vers l'iAsted...");
      window.location.href = `/minister-dashboard/iasted?session=${sessionId}`;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Paramètres Vocaux
          </CardTitle>
          <CardDescription>
            Configurez les options de l'assistant vocal iAsted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="focus-mode">Mode Focus</Label>
              <p className="text-sm text-muted-foreground">
                Maintenir des conversations approfondies sur un seul sujet avec reprise possible
              </p>
            </div>
            <Switch
              id="focus-mode"
              checked={focusModeEnabled}
              onCheckedChange={updateFocusMode}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      {focusModeEnabled && (
        <FocusSessionsPanel onResumeSession={handleResumeSession} />
      )}
    </div>
  );
}
