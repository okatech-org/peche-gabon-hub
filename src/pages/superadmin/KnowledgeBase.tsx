import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, BookOpen, Calendar, TrendingUp, Tag, FileText, Eye, ExternalLink, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface KnowledgeEntry {
  id: string;
  titre: string;
  contenu_synthetise: string;
  themes: string[];
  mots_cles: string[];
  conversations_sources: string[];
  nb_references: number;
  derniere_mise_a_jour: string;
  score_pertinence: number;
  created_at: string;
}

interface ConversationSource {
  id: string;
  titre: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tags: string[];
}

export default function KnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<KnowledgeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allThemes, setAllThemes] = useState<string[]>([]);
  const [allKeywords, setAllKeywords] = useState<string[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [conversationSources, setConversationSources] = useState<ConversationSource[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [searchQuery, selectedThemes, selectedKeywords, entries]);

  const loadKnowledgeBase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('knowledge_base_entries')
        .select('*')
        .order('score_pertinence', { ascending: false })
        .order('derniere_mise_a_jour', { ascending: false });

      if (error) throw error;

      if (data) {
        setEntries(data);
        
        // Extract unique themes and keywords
        const themesSet = new Set<string>();
        const keywordsSet = new Set<string>();
        
        data.forEach(entry => {
          entry.themes?.forEach((theme: string) => themesSet.add(theme));
          entry.mots_cles?.forEach((keyword: string) => keywordsSet.add(keyword));
        });
        
        setAllThemes(Array.from(themesSet).sort());
        setAllKeywords(Array.from(keywordsSet).sort());
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la base de connaissance.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.titre.toLowerCase().includes(query) ||
        entry.contenu_synthetise.toLowerCase().includes(query) ||
        entry.themes?.some((t: string) => t.toLowerCase().includes(query)) ||
        entry.mots_cles?.some((k: string) => k.toLowerCase().includes(query))
      );
    }

    // Filter by themes
    if (selectedThemes.length > 0) {
      filtered = filtered.filter(entry =>
        selectedThemes.some(theme => entry.themes?.includes(theme))
      );
    }

    // Filter by keywords
    if (selectedKeywords.length > 0) {
      filtered = filtered.filter(entry =>
        selectedKeywords.some(keyword => entry.mots_cles?.includes(keyword))
      );
    }

    setFilteredEntries(filtered);
  };

  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedThemes([]);
    setSelectedKeywords([]);
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-blue-600";
    if (score >= 0.4) return "text-yellow-600";
    return "text-gray-600";
  };

  const openEntryDetails = async (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
    setLoadingConversations(true);
    
    try {
      const { data, error } = await supabase
        .from('conversations_iasted')
        .select('*')
        .in('id', entry.conversations_sources)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setConversationSources(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations sources.",
        variant: "destructive"
      });
    } finally {
      setLoadingConversations(false);
    }
  };

  const openConversation = (conversationId: string) => {
    // Navigate to iAsted page with conversation ID
    navigate('/minister-dashboard/iasted', { state: { conversationId } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Chargement de la base de connaissance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Base de Connaissance</h1>
        <p className="text-muted-foreground">
          Insights synthétisés des conversations avec iAsted
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <Card className="lg:col-span-1 p-4 h-fit">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Search className="h-4 w-4" />
                Filtres
              </h3>
              {(selectedThemes.length > 0 || selectedKeywords.length > 0 || searchQuery) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Réinitialiser
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Thèmes ({allThemes.length})
              </label>
              <ScrollArea className="h-[200px]">
                <div className="space-y-1">
                  {allThemes.map((theme) => (
                    <Button
                      key={theme}
                      variant={selectedThemes.includes(theme) ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => toggleTheme(theme)}
                    >
                      {theme}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Mots-clés ({allKeywords.length})
              </label>
              <ScrollArea className="h-[200px]">
                <div className="space-y-1">
                  {allKeywords.map((keyword) => (
                    <Button
                      key={keyword}
                      variant={selectedKeywords.includes(keyword) ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => toggleKeyword(keyword)}
                    >
                      {keyword}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </Card>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-semibold">
                  {filteredEntries.length} entrée{filteredEntries.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Total : {entries.length} entrées dans la base
              </div>
            </div>
          </Card>

          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <Card className="p-12 text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Aucune entrée trouvée
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Essayez de modifier vos critères de recherche
                  </p>
                </Card>
              ) : (
                filteredEntries.map((entry) => (
                  <Card key={entry.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{entry.titre}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(entry.derniere_mise_a_jour), 'dd MMM yyyy', { locale: fr })}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {entry.nb_references} référence{entry.nb_references > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={getRelevanceColor(entry.score_pertinence)}
                          >
                            Score: {(entry.score_pertinence * 100).toFixed(0)}%
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEntryDetails(entry)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="prose prose-sm max-w-none">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {entry.contenu_synthetise}
                        </p>
                      </div>

                      {/* Themes */}
                      {entry.themes && entry.themes.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            THÈMES
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {entry.themes.map((theme) => (
                              <Badge
                                key={theme}
                                variant="secondary"
                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                onClick={() => toggleTheme(theme)}
                              >
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Keywords */}
                      {entry.mots_cles && entry.mots_cles.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            MOTS-CLÉS
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {entry.mots_cles.map((keyword) => (
                              <Badge
                                key={keyword}
                                variant="outline"
                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                onClick={() => toggleKeyword(keyword)}
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Entry Details Modal */}
      <Dialog open={selectedEntry !== null} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedEntry?.titre}</DialogTitle>
            <DialogDescription>
              Détails complets de l'entrée de base de connaissance
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Créée le</label>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedEntry.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Dernière mise à jour</label>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedEntry.derniere_mise_a_jour), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Nombre de références</label>
                    <p className="text-sm font-medium">{selectedEntry.nb_references}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Score de pertinence</label>
                    <p className="text-sm font-medium">
                      <Badge variant="outline" className={getRelevanceColor(selectedEntry.score_pertinence)}>
                        {(selectedEntry.score_pertinence * 100).toFixed(0)}%
                      </Badge>
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">Contenu synthétisé</label>
                  <div className="prose prose-sm max-w-none p-4 bg-muted/30 rounded-lg">
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {selectedEntry.contenu_synthetise}
                    </p>
                  </div>
                </div>

                {/* Themes */}
                {selectedEntry.themes && selectedEntry.themes.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Thèmes</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.themes.map((theme) => (
                        <Badge key={theme} variant="secondary">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {selectedEntry.mots_cles && selectedEntry.mots_cles.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Mots-clés</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.mots_cles.map((keyword) => (
                        <Badge key={keyword} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Conversation Sources */}
                <div>
                  <label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Conversations sources ({selectedEntry.conversations_sources.length})
                  </label>

                  {loadingConversations ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : conversationSources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune conversation source disponible
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {conversationSources.map((conversation) => (
                        <Card
                          key={conversation.id}
                          className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => openConversation(conversation.id)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                                <h4 className="font-medium text-sm">{conversation.titre}</h4>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  Créée: {format(new Date(conversation.created_at), 'dd MMM yyyy', { locale: fr })}
                                </span>
                                <span>
                                  Modifiée: {format(new Date(conversation.updated_at), 'dd MMM yyyy', { locale: fr })}
                                </span>
                              </div>
                              {conversation.tags && conversation.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {conversation.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
