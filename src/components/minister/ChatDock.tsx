import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: Date;
}

interface ChatDockProps {
  messages: Message[];
  className?: string;
}

export function ChatDock({ messages, className }: ChatDockProps) {
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <div className="p-4 border-b">
        <h3 className="font-semibold">Transcription</h3>
        <p className="text-xs text-muted-foreground">
          Historique de la conversation avec iAsted
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun message pour le moment</p>
              <p className="text-xs mt-1">
                Démarrez une conversation vocale avec iAsted
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3 p-3 rounded-lg",
                  msg.role === 'user' 
                    ? "bg-primary/10 ml-4" 
                    : "bg-muted mr-4"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === 'user' ? "bg-primary" : "bg-secondary"
                )}>
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Bot className="h-4 w-4 text-secondary-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {msg.role === 'user' ? 'Vous' : 'iAsted'}
                    </span>
                    {msg.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {msg.timestamp.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
