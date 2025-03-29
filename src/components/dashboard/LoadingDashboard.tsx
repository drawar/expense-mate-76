// src/components/dashboard/LoadingDashboard.tsx
import React from 'react';

/**
 * Component that displays a loading state for the dashboard
 * Uses skeleton loading pattern for better UX
 */
const LoadingDashboard: React.FC = () => {
  // Render the header skeleton
  const renderHeaderSkeleton = () => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
        <div className="animate-pulse bg-muted h-10 w-48 rounded-md"></div>
        <div className="animate-pulse bg-muted h-10 w-32 rounded-md mt-4 sm:mt-0"></div>
      </div>
    );
  };
  
  // Render the filter controls skeleton
  const renderFilterSkeleton = () => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="animate-pulse bg-muted h-8 w-40 rounded-md"></div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <div className="animate-pulse bg-muted h-8 w-24 rounded-md"></div>
          <div className="animate-pulse bg-muted h-8 w-32 rounded-md"></div>
          <div className="animate-pulse bg-muted h-8 w-28 rounded-md"></div>
        </div>
      </div>
    );
  };
  
  // Render the summary cards skeleton
  const renderSummaryCardsSkeleton = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={`summary-${index}`} className="animate-pulse bg-muted h-28 rounded-xl"></div>
        ))}
      </div>
    );
  };
  
  // Render the card grid skeleton
  const renderCardGridSkeleton = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={`card-${index}`} className="animate-pulse bg-muted h-64 rounded-xl"></div>
        ))}
      </div>
    );
  };
  
  // Render the transactions skeleton
  const renderTransactionsSkeleton = () => {
    return (
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <div className="animate-pulse bg-muted h-8 w-48 rounded-md"></div>
          <div className="animate-pulse bg-muted h-8 w-24 rounded-md"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={`tx-${index}`} className="animate-pulse bg-muted h-24 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen animate-fadeIn">  
      <div className="container max-w-7xl mx-auto pb-16 px-4 md:px-6">
        {renderHeaderSkeleton()}
        {renderFilterSkeleton()}
        {renderSummaryCardsSkeleton()}
        {renderCardGridSkeleton()}
        {renderTransactionsSkeleton()}
      </div>
    </div>
  );
};

export default LoadingDashboard;
