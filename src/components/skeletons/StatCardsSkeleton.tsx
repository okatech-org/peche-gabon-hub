import { CardSkeleton } from "./CardSkeleton";

interface StatCardsSkeletonProps {
  count?: number;
}

export const StatCardsSkeleton = ({ count = 4 }: StatCardsSkeletonProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} showIcon={true} lines={1} />
      ))}
    </div>
  );
};
