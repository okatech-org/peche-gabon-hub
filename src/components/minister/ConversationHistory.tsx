import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, MessageSquare, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Conversation {
  id: string;
  titre: string;
  created_at: string;
  updated_at: string;
  messageCount?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const ConversationHistory = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations_iasted')
        .select(`
          id,
          titre,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Compter les messages pour chaque conversation
      const conversationsWithCount = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('messages_iasted')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return { ...conv, messageCount: count || 0 };
        })
      );

      setConversations(conversationsWithCount);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des conversations.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterConversations = () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter(conv =>
      conv.titre.toLowerCase().includes(query)
    );
    setFilteredConversations(filtered);
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages_iasted')
        .select('role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(m => ({
        ...m,
        role: m.role as 'user' | 'assistant'
      })));
      setSelectedConversation(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages.",
        variant: "destructive"
      });
    }
  };

  const deleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      const { error } = await supabase
        .from('conversations_iasted')
        .delete()
        .eq('id', conversationToDelete);

      if (error) throw error;

      toast({
        title: "Supprimé",
        description: "La conversation a été supprimée avec succès.",
      });

      setConversations(prev => prev.filter(c => c.id !== conversationToDelete));
      if (selectedConversation === conversationToDelete) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la conversation.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleDeleteClick = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Liste des conversations */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Historique
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-350px)]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "Aucune conversation trouvée" : "Aucune conversation"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedConversation === conv.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => loadMessages(conv.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{conv.titre}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(conv.updated_at), 'dd MMM yyyy', { locale: fr })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {conv.messageCount} msg
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(conv.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages de la conversation sélectionnée */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedConversation
              ? conversations.find(c => c.id === selectedConversation)?.titre
              : "Sélectionnez une conversation"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedConversation ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Sélectionnez une conversation pour voir les messages</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les messages de cette conversation seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteConversation} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
