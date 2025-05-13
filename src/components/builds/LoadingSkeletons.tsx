
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const LoadingSkeletons = () => (
  <div className="space-y-4">
    <div className="flex gap-2 mb-6">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-20" />
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-wrap justify-between items-center gap-2">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="hidden md:block h-6 w-24" />
              <Skeleton className="hidden md:block h-6 w-36" />
              <Skeleton className="hidden md:block h-6 w-24" />
              <Skeleton className="hidden md:block h-6 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default LoadingSkeletons;
