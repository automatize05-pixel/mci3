import { Skeleton } from "@/components/ui/skeleton";

export const PostSkeleton = () => {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <div className="flex items-center gap-3 p-4 pb-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="px-4 pb-3 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="w-full h-64" />
      <div className="flex items-center gap-1 px-2 py-2 border-t border-border">
        <Skeleton className="h-8 w-16 rounded-xl mx-2" />
        <Skeleton className="h-8 w-16 rounded-xl mx-2" />
      </div>
    </div>
  );
};

export default PostSkeleton;
