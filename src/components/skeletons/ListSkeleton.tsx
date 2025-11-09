import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
}

export const ListSkeleton = ({ 
  items = 5,
  showAvatar = false 
}: ListSkeletonProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {Array.from({ length: items }).map((_, i) => (
            <div 
              key={i} 
              className="flex items-center gap-4 p-3 rounded-lg border animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {showAvatar && (
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              )}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
