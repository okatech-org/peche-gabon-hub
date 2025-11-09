import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  MessageSquare, 
  AlertTriangle, 
  Newspaper,
  Hash,
  ThumbsUp,
  CheckCircle,
  Eye,
  ChevronRight,
  FileDown,
  Volume2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface RemonteeType {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  count?: number;
}

const remonteeTypes: RemonteeType[] = [
  {
    id: "tous",
    label: "Tous les types",
    icon: CheckCircle,
    color: "text-primary",
    bgColor: "bg-primary/10 hover:bg-primary/20"
  },
  {
    id: "reclamation",
    label: "Réclamation",
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50"
  },
  {
    id: "suggestion",
    label: "Suggestion",
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
  },
  {
    id: "denonciation",
    label: "Dénonciation",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
  },
  {
    id: "article_presse",
    label: "Article de presse",
    icon: Newspaper,
    color: "text-amber-600",
    bgColor: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
  },
  {
    id: "commentaire_reseau",
    label: "Commentaire réseau",
    icon: Hash,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-950/50"
  },
  {
    id: "avis_reseau_social",
    label: "Avis réseau social",
    icon: ThumbsUp,
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50"
  }
];

interface RemonteeTypeCardsProps {
  selectedType: string;
  onTypeSelect: (typeId: string) => void;
  typeCounts?: Record<string, number>;
  newCounts?: Record<string, number>;
  onViewDetails?: (typeId: string) => void;
  onExportPDF?: (typeId: string) => void;
  onGenerateAudio?: (typeId: string) => void;
}

export function RemonteeTypeCards({ 
  selectedType, 
  onTypeSelect, 
  typeCounts, 
  newCounts, 
  onViewDetails,
  onExportPDF,
  onGenerateAudio 
}: RemonteeTypeCardsProps) {
  const [loadingPDF, setLoadingPDF] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
      {remonteeTypes.map((type, index) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;
        const count = type.id === "tous" 
          ? Object.values(typeCounts || {}).reduce((sum, val) => sum + val, 0)
          : typeCounts?.[type.id] || 0;
        const newCount = type.id === "tous"
          ? Object.values(newCounts || {}).reduce((sum, val) => sum + val, 0)
          : newCounts?.[type.id] || 0;
        const hasNew = newCount > 0;

        return (
          <Card
            key={type.id}
            className={cn(
              "cursor-pointer transition-all duration-300 border-2 hover:shadow-md animate-fade-in hover:scale-[1.02] group relative",
              isSelected 
                ? "border-primary shadow-lg scale-105 animate-scale-in" 
                : "border-transparent hover:border-border",
              type.bgColor,
              hasNew && !isSelected && "animate-pulse"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4" onClick={() => onTypeSelect(type.id)}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className={cn(
                  "rounded-full p-3 transition-all duration-300",
                  isSelected 
                    ? "bg-primary/20 scale-110" 
                    : "bg-background/50 hover:scale-105"
                )}>
                  <Icon className={cn(
                    "h-6 w-6 transition-all duration-300",
                    isSelected ? "text-primary scale-110" : type.color
                  )} />
                </div>
                
                <div className="space-y-1">
                  <p className={cn(
                    "text-sm font-medium leading-tight transition-all duration-300",
                    isSelected ? "text-primary font-semibold scale-105" : "text-foreground"
                  )}>
                    {type.label}
                  </p>
                  
                  {count > 0 && (
                    <Badge 
                      variant={isSelected ? "default" : hasNew ? "destructive" : "secondary"}
                      className={cn(
                        "text-xs transition-all duration-300",
                        isSelected && "animate-scale-in",
                        hasNew && "font-semibold"
                      )}
                    >
                      {count}
                      {hasNew && (
                        <span className="ml-1 text-[10px]">
                          ({newCount} nouv.)
                        </span>
                      )}
                    </Badge>
                  )}
                </div>

                {isSelected && (
                  <CheckCircle className="h-4 w-4 text-primary absolute top-2 right-2 animate-scale-in" />
                )}
              </div>
            </CardContent>
            
            {/* Actions - visible au hover */}
            {count > 0 && type.id !== "tous" && (
              <div className="absolute bottom-2 left-0 right-0 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-1">
                {/* Bouton Voir détails */}
                {onViewDetails && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-6 text-[10px] px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(type.id);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Voir détails
                  </Button>
                )}
                
                {/* Actions Export & Audio */}
                <div className="flex gap-1">
                  {onExportPDF && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 h-6 text-[10px] px-1"
                      disabled={loadingPDF === type.id}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLoadingPDF(type.id);
                        await onExportPDF(type.id);
                        setLoadingPDF(null);
                      }}
                      title="Export PDF"
                    >
                      {loadingPDF === type.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileDown className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  
                  {onGenerateAudio && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 h-6 text-[10px] px-1"
                      disabled={loadingAudio === type.id}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLoadingAudio(type.id);
                        await onGenerateAudio(type.id);
                        setLoadingAudio(null);
                      }}
                      title="Synthèse vocale IA"
                    >
                      {loadingAudio === type.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Volume2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
