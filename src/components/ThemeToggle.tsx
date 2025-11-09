import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ThemeToggleProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export const ThemeToggle = ({ 
  variant = "ghost", 
  size = "icon",
  showLabel = false 
}: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  if (showLabel) {
    return (
      <Button 
        variant={variant} 
        size={size}
        onClick={toggleTheme}
        className="gap-2"
      >
        {theme === "light" ? (
          <>
            <Moon className="h-4 w-4" />
            <span>Mode sombre</span>
          </>
        ) : (
          <>
            <Sun className="h-4 w-4" />
            <span>Mode clair</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant={variant} 
            size={size}
            onClick={toggleTheme}
            className="relative"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Basculer le thème</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{theme === "light" ? "Passer en mode sombre" : "Passer en mode clair"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
