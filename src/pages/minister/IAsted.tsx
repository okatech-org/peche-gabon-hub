import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { IAstedChat } from "@/components/minister/IAstedChat";
import { ConversationHistory } from "@/components/minister/ConversationHistory";
import { ChatDock } from "@/components/minister/ChatDock";
import { VoiceSettings } from "@/components/minister/VoiceSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, History, Settings } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: Date;
}

export default function IAsted() {
  const [activeTab, setActiveTab] = useState("chat");
  const location = useLocation();
  const [conversationIdToLoad, setConversationIdToLoad] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceSettings, setVoiceSettings] = useState({
    voiceId: undefined as string | undefined,
    silenceDuration: 1000,
    threshold: 0.5,
    continuousMode: false
  });

  useEffect(() => {
    // Check if we received a conversation ID from navigation state
    if (location.state?.conversationId) {
      setConversationIdToLoad(location.state.conversationId);
      setActiveTab("chat");
    }
  }, [location.state]);

  const handleNewMessage = (role: 'user' | 'assistant', text: string) => {
    setMessages(prev => [...prev, { role, text, timestamp: new Date() }]);
  };

  const handleVoiceChange = (voiceId: string) => {
    setVoiceSettings(prev => ({ ...prev, voiceId }));
  };

  const handleSilenceDurationChange = (silenceDuration: number) => {
    setVoiceSettings(prev => ({ ...prev, silenceDuration }));
  };

  const handleThresholdChange = (threshold: number) => {
    setVoiceSettings(prev => ({ ...prev, threshold }));
  };

  const handleContinuousModeChange = (continuousMode: boolean) => {
    setVoiceSettings(prev => ({ ...prev, continuousMode }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">iAsted - Assistant Vocal</h1>
        <p className="text-muted-foreground">
          Votre assistant vocal intelligent pour l'analyse et la synthèse des données du secteur de la pêche
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <IAstedChat 
                conversationIdToLoad={conversationIdToLoad}
                onMessage={handleNewMessage}
                voiceSettings={voiceSettings}
              />
            </div>
            <div className="lg:col-span-1">
              <ChatDock messages={messages} className="h-[600px]" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ConversationHistory />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <VoiceSettings
              onVoiceChange={handleVoiceChange}
              onSilenceDurationChange={handleSilenceDurationChange}
              onThresholdChange={handleThresholdChange}
              onContinuousModeChange={handleContinuousModeChange}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

