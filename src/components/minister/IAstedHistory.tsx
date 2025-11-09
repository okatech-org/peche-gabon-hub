import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { History, Search, Trash2, MessageSquare, Calendar, Tag, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Conversation {
  id: string;
  titre: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

const TAG_COLORS: Record<string, string> = {
  'Budget': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  'Pêche Artisanale': 'bg-green-500/10 text-green-700 border-green-500/20',
  'Pêche Industrielle': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  'Surveillance': 'bg-red-500/10 text-red-700 border-red-500/20',
  'Formations': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  'Économie': 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  'Finances': 'bg-pink-500/10 text-pink-700 border-pink-500/20',
  'Remontées Terrain': 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  'Actions Ministérielles': 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
  'Alertes': 'bg-red-600/10 text-red-800 border-red-600/20',
  'Réglementations': 'bg-gray-500/10 text-gray-700 border-gray-500/20',
  'Statistiques': 'bg-teal-500/10 text-teal-700 border-teal-500/20',
  'Infractions': 'bg-rose-500/10 text-rose-700 border-rose-500/20',
  'Licences': 'bg-violet-500/10 text-violet-700 border-violet-500/20',
  'Captures': 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  'Flotte': 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  'Coopératives': 'bg-lime-500/10 text-lime-700 border-lime-500/20',
  'Recettes': 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  'Prévisions': 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20',
  'Analyses': 'bg-slate-500/10 text-slate-700 border-slate-500/20',
};

interface IAstedHistoryProps {
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
}

export const IAstedHistory = ({ 
  onSelectConversation, 
  onDeleteConversation,
  onNewConversation 
}: IAstedHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    loadConversations();
  }, [selectedTags]);

  const loadConversations = async () => {
    let query = supabase
      .from('conversations_iasted')
      .select('*')
      .order('updated_at', { ascending: false });

    // Filtrer par tags si sélectionnés
    if (selectedTags.length > 0) {
      query = query.overlaps('tags', selectedTags);
    }

    const { data, error } = await query;

    if (!error && data) {
      setConversations(data);
      
      // Extraire tous les tags uniques
      const allTags = new Set<string>();
      data.forEach(conv => {
        if (conv.tags) {
          conv.tags.forEach((tag: string) => allTags.add(tag));
        }
      });
      setAvailableTags(Array.from(allTags).sort());
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const searchConversations = async () => {
    if (!searchQuery.trim()) {
      loadConversations();
      return;
    }

    const { data, error } = await supabase
      .from('messages_iasted')
      .select('conversation_id')
      .textSearch('content', searchQuery, {
        type: 'websearch',
        config: 'french'
      });

    if (!error && data) {
      const conversationIds = [...new Set(data.map(m => m.conversation_id))];
      
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations_iasted')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (!convError && conversationsData) {
        setConversations(conversationsData);
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conversationToDelete) {
      onDeleteConversation(conversationToDelete);
      loadConversations();
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Historique des conversations</h3>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {availableTags.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Aucun tag disponible
                    </div>
                  ) : (
                    availableTags.map(tag => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => toggleTag(tag)}
                      >
                        <Tag className="h-3 w-3 mr-2" />
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={onNewConversation} size="sm">
                Nouvelle
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchConversations();
                }
              }}
              placeholder="Rechercher dans les conversations..."
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune conversation trouvée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="group flex items-start gap-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                    <div 
                      className="flex-1 min-w-0"
                      onClick={() => onSelectConversation(conv.id)}
                    >
                      <p className="font-medium text-sm truncate">{conv.titre}</p>
                      
                      {conv.tags && conv.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {conv.tags.slice(0, 3).map((tag, i) => (
                            <Badge 
                              key={i} 
                              variant="outline"
                              className={`text-xs ${TAG_COLORS[tag] || 'bg-muted'}`}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {conv.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{conv.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(conv.updated_at), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(conv.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les messages de cette conversation seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
