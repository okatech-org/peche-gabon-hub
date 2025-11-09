import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
    
    // Fade out
    setIsVisible(false);
    
    // Fade in after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      className={`transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{ minHeight: "100vh" }}
    >
      {children}
    </div>
  );
};
