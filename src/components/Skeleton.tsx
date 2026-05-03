import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/** Base shimmering placeholder. Compose with width/height/rounded utilities. */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...rest }) => (
  <div className={`skeleton-shimmer rounded-xl ${className}`} aria-hidden="true" {...rest} />
);

/** Quick hotel card skeleton matching HotelsHub grid. */
export const HotelCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200">
    <Skeleton className="h-56 w-full !rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

/** List row skeleton for tables / activity feeds. */
export const ListRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-stone-200">
    <Skeleton className="h-12 w-12 rounded-xl" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-3 w-2/5" />
    </div>
    <Skeleton className="h-8 w-16 rounded-full" />
  </div>
);

export default Skeleton;
