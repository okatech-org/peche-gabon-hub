import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Priorité: localStorage > DB > dark par défaut (géré au login)
    const stored = localStorage.getItem("theme") as Theme;
    return stored || "dark";
  });

  useEffect(() => {
    // Appliquer le thème au document
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Sauvegarder dans localStorage pour accès rapide
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return { theme, toggleTheme, setTheme };
};
