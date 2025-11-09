import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CardSkeletonProps {
  showIcon?: boolean;
  lines?: number;
}

export const CardSkeleton = ({ 
  showIcon = true,
  lines = 2 
}: CardSkeletonProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        {showIcon && <Skeleton className="h-4 w-4 rounded" />}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="h-3 w-full" 
              style={{ width: `${Math.random() * 40 + 60}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
