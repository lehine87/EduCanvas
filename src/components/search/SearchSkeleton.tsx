'use client'

import { Skeleton } from '@/components/ui/skeleton'

interface SearchSkeletonProps {
  count?: number
}

export default function SearchSkeleton({ count = 3 }: SearchSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3">
          {/* Avatar skeleton */}
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          
          {/* Action skeleton */}
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}