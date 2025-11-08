import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MessageSquare, 
  AlertTriangle, 
  Newspaper,
  Hash,
  ThumbsUp,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function RemonteeTypeCards({ selectedType, onTypeSelect, typeCounts, newCounts }: RemonteeTypeCardsProps) {
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
              "cursor-pointer transition-all duration-300 border-2 hover:shadow-md animate-fade-in hover:scale-[1.02]",
              isSelected 
                ? "border-primary shadow-lg scale-105 animate-scale-in" 
                : "border-transparent hover:border-border",
              type.bgColor,
              hasNew && !isSelected && "animate-pulse"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onTypeSelect(type.id)}
          >
            <CardContent className="p-4">
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
          </Card>
        );
      })}
    </div>
  );
}
