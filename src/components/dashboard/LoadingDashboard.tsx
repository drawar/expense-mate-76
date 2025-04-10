// src/components/dashboard/LoadingDashboard.tsx
import React from 'react';

/**
 * Component that displays an optimized loading state for the dashboard
 */
const LoadingDashboard: React.FC = () => {
  // Create reusable skeleton components
  const SkeletonBlock = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-muted ${className}`}></div>
  );
  
  // Render the summary cards skeleton
  const SummaryCardSkeleton = () => (
    <SkeletonBlock className="h-28 rounded-xl" />
  );
  
  // Render the insight card skeleton
  const InsightCardSkeleton = () => (
    <SkeletonBlock className="h-64 rounded-xl" />
  );
  
  // Render the transaction card skeleton
  const TransactionCardSkeleton = () => (
    <SkeletonBlock className="h-24 rounded-xl" />
  );
  
  return (
    <div className="min-h-screen animate-fadeIn">  
      <div className="container max-w-7xl mx-auto pb-16 px-4 md:px-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
          <SkeletonBlock className="h-10 w-48 rounded-md" />
          <SkeletonBlock className="h-10 w-32 rounded-md mt-4 sm:mt-0" />
        </div>
        
        {/* Filter Controls Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <SkeletonBlock className="h-8 w-40 rounded-md" />
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <SkeletonBlock className="h-8 w-24 rounded-md" />
            <SkeletonBlock className="h-8 w-32 rounded-md" />
            <SkeletonBlock className="h-8 w-28 rounded-md" />
          </div>
        </div>
        
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {Array(2).fill(0).map((_, index) => (
            <SummaryCardSkeleton key={`summary-${index}`} />
          ))}
        </div>
        
        {/* Insights Title Skeleton */}
        <SkeletonBlock className="h-8 w-48 rounded-md mb-6" />
        
        {/* Insights Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Array(4).fill(0).map((_, index) => (
            <InsightCardSkeleton key={`insight-${index}`} />
          ))}
        </div>
        
        {/* Recent Transactions Skeleton */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <SkeletonBlock className="h-8 w-48 rounded-md" />
            <SkeletonBlock className="h-8 w-24 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, index) => (
              <TransactionCardSkeleton key={`tx-${index}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingDashboard;
