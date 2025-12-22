// components/dashboard/layout/LoadingDashboard.tsx
import React from "react";

/**
 * Shimmer effect for skeleton loading
 */
const Shimmer: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-muted rounded-lg ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

/**
 * Summary card skeleton with header and content
 */
const SummaryCardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-border/50 bg-card p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Shimmer className="h-5 w-5" />
        <Shimmer className="h-5 w-32" />
      </div>
      <Shimmer className="h-8 w-8 rounded-full" />
    </div>
    <Shimmer className="h-9 w-28 mb-2" />
    <Shimmer className="h-4 w-20 mb-4" />
    <Shimmer className="h-2 w-full mb-2" />
    <Shimmer className="h-3 w-24" />
  </div>
);

/**
 * Insight card skeleton with chart placeholder
 */
const InsightCardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-border/50 bg-card p-5">
    <div className="flex items-center gap-2 mb-4">
      <Shimmer className="h-5 w-5" />
      <Shimmer className="h-5 w-40" />
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-4 w-16" />
      </div>
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-4 w-12" />
      </div>
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-28" />
        <Shimmer className="h-4 w-14" />
      </div>
      <Shimmer className="h-32 w-full mt-4" />
    </div>
  </div>
);

/**
 * Transaction row skeleton
 */
const TransactionRowSkeleton: React.FC = () => (
  <div className="flex items-center justify-between px-4 py-3">
    <div className="flex-1">
      <Shimmer className="h-4 w-32 mb-1.5" />
      <Shimmer className="h-3 w-24" />
    </div>
    <div className="text-right">
      <Shimmer className="h-4 w-16 mb-1" />
      <Shimmer className="h-3 w-12" />
    </div>
  </div>
);

/**
 * Component that displays an optimized loading state for the dashboard
 * with shimmer animation for better perceived performance
 */
const LoadingDashboard: React.FC = () => {
  return (
    <div className="min-h-screen">
      <style>
        {`
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>
      <div className="container max-w-7xl mx-auto pb-16 px-4 md:px-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6 mt-4">
          <div>
            <Shimmer className="h-7 w-36 mb-1" />
            <Shimmer className="h-4 w-24" />
          </div>
          <Shimmer className="h-9 w-9 rounded-lg" />
        </div>

        {/* Filter Bar Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Shimmer className="h-9 w-24 rounded-lg" />
          <Shimmer className="h-9 w-28 rounded-lg" />
          <Shimmer className="h-9 w-9 rounded-lg" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <SummaryCardSkeleton />
          <SummaryCardSkeleton />
        </div>

        {/* Insights Section Skeleton */}
        <div className="mt-6">
          <Shimmer className="h-6 w-36 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightCardSkeleton />
            <InsightCardSkeleton />
            <InsightCardSkeleton />
            <InsightCardSkeleton />
          </div>
        </div>

        {/* Recent Transactions Skeleton */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <Shimmer className="h-6 w-40" />
            <Shimmer className="h-4 w-16" />
          </div>
          <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50">
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingDashboard;
