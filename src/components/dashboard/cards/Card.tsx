// components/dashboard/cards/Card.tsx
import React from 'react';
import { Card as UICard, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  emptyState?: {
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
  };
}

/**
 * Base dashboard card component that handles loading, empty state, and error state
 */
const Card: React.FC<DashboardCardProps> = ({
  title,
  icon,
  className = '',
  children,
  actions,
  loading = false,
  error = null,
  emptyState,
}) => {
  // Loading state
  if (loading) {
    return (
      <UICard className={`${className} animate-pulse`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-48" />
        </CardContent>
      </UICard>
    );
  }

  // Error state
  if (error) {
    return (
      <UICard className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </UICard>
    );
  }

  // Empty state
  if (emptyState && React.Children.count(children) === 0) {
    return (
      <UICard className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center">
            {emptyState.icon}
            <p className="text-muted-foreground font-medium mb-1">{emptyState.title}</p>
            <p className="text-xs text-muted-foreground">{emptyState.description}</p>
            {emptyState.action && <div className="mt-4">{emptyState.action}</div>}
          </div>
        </CardContent>
      </UICard>
    );
  }

  // Normal state
  return (
    <UICard className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {actions}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </UICard>
  );
};

export default React.memo(Card);
