import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const DemoBadge = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
            <Badge 
              variant="outline" 
              className="px-4 py-2 text-sm font-bold bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-all shadow-lg backdrop-blur-sm animate-pulse cursor-help"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              MODE DÉMO
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-semibold mb-1">Environnement de démonstration</p>
          <p className="text-xs text-muted-foreground">
            Les données affichées sont publiques et à but de démonstration uniquement. 
            Aucune donnée sensible réelle n'est utilisée dans cet environnement.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
