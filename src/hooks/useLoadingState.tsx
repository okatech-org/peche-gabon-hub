import { useState, useEffect } from "react";

interface UseLoadingStateProps {
  minimumLoadingTime?: number;
}

export const useLoadingState = ({ 
  minimumLoadingTime = 500 
}: UseLoadingStateProps = {}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    // Ensure minimum loading time for smooth skeleton display
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, minimumLoadingTime);

    return () => clearTimeout(timer);
  }, [minimumLoadingTime]);

  return {
    isLoading: isLoading && showSkeleton,
    setIsLoading,
    showSkeleton
  };
};
