import { Skeleton } from "@/components/ui/skeleton";
import { StatCardsSkeleton } from "./StatCardsSkeleton";
import { ChartSkeleton } from "./ChartSkeleton";
import { TableSkeleton } from "./TableSkeleton";

interface DashboardSkeletonProps {
  layout?: "default" | "minister" | "admin";
}

export const DashboardSkeleton = ({ layout = "default" }: DashboardSkeletonProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Cards */}
      <StatCardsSkeleton count={4} />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartSkeleton type="bar" />
        <ChartSkeleton type="line" />
      </div>

      {layout === "minister" && (
        <div className="grid gap-6 md:grid-cols-3">
          <ChartSkeleton type="pie" />
          <div className="md:col-span-2">
            <TableSkeleton rows={5} columns={5} />
          </div>
        </div>
      )}

      {/* Table */}
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
};
