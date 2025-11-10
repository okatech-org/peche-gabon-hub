import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Trash2, Clock, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface FocusSession {
  id: string;
  focus_topic: string | null;
  focus_depth: number | null;
  focus_started_at: string | null;
  updated_at: string;
  title: string | null;
}

interface FocusSessionsPanelProps {
  onResumeSession: (sessionId: string) => void;
}

export function FocusSessionsPanel({ onResumeSession }: FocusSessionsPanelProps) {
  const queryClient = useQueryClient();

  const { data: focusSessions, isLoading } = useQuery({
    queryKey: ['focus-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_sessions')
        .select('id, focus_topic, focus_depth, focus_started_at, updated_at, title')
        .eq('focus_mode', true)
        .not('focus_topic', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as FocusSession[];
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('conversation_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      toast.success("Session supprimée avec succès");
    },
    onError: (error) => {
      console.error('Error deleting session:', error);
      toast.error("Erreur lors de la suppression de la session");
    }
  });

  const getDepthColor = (depth: number) => {
    if (depth <= 2) return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (depth <= 4) return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    return "bg-pink-500/10 text-pink-600 border-pink-500/20";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sessions Focus en cours</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Sessions Focus en cours
        </CardTitle>
        <CardDescription>
          Reprenez une conversation approfondie là où vous l'aviez laissée
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!focusSessions || focusSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune session focus active. Activez le mode focus dans les paramètres pour commencer.
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {focusSessions.map((session) => (
                <Card key={session.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm">
                          {session.focus_topic || session.title || 'Sans titre'}
                        </h4>
                        <Badge variant="outline" className={getDepthColor(session.focus_depth || 0)}>
                          Niveau {session.focus_depth || 0}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {session.updated_at ? 
                              formatDistanceToNow(new Date(session.updated_at), { 
                                addSuffix: true, 
                                locale: fr 
                              }) : 
                              'Date inconnue'
                            }
                          </span>
                        </div>
                        {session.focus_started_at && (
                          <div className="text-xs">
                            Démarré {formatDistanceToNow(new Date(session.focus_started_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResumeSession(session.id)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Reprendre
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSessionMutation.mutate(session.id)}
                        disabled={deleteSessionMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
