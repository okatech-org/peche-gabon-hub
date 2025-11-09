import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ChartSkeletonProps {
  type?: "bar" | "line" | "pie";
  showLegend?: boolean;
}

export const ChartSkeleton = ({ 
  type = "bar",
  showLegend = true 
}: ChartSkeletonProps) => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart Area */}
          {type === "pie" ? (
            <div className="flex items-center justify-center">
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Y-axis labels and bars */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton 
                    className="h-8" 
                    style={{ 
                      width: `${Math.random() * 60 + 20}%`,
                      transition: "all 0.3s ease"
                    }}
                  />
                </div>
              ))}
              {/* X-axis */}
              <div className="flex justify-between pt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-12" />
                ))}
              </div>
            </div>
          )}
          
          {/* Legend */}
          {showLegend && (
            <div className="flex justify-center gap-4 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
