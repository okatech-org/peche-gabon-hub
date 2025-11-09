import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { IAstedChat } from "@/components/minister/IAstedChat";
import { ConversationHistory } from "@/components/minister/ConversationHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, History } from "lucide-react";

export default function IAsted() {
  const [activeTab, setActiveTab] = useState("chat");
  const location = useLocation();
  const [conversationIdToLoad, setConversationIdToLoad] = useState<string | null>(null);

  useEffect(() => {
    // Check if we received a conversation ID from navigation state
    if (location.state?.conversationId) {
      setConversationIdToLoad(location.state.conversationId);
      setActiveTab("chat");
    }
  }, [location.state]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">iAsted - Assistant Vocal</h1>
        <p className="text-muted-foreground">
          Votre assistant vocal intelligent pour l'analyse et la synthèse des données du secteur de la pêche
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-6">
          <IAstedChat conversationIdToLoad={conversationIdToLoad} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <ConversationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

