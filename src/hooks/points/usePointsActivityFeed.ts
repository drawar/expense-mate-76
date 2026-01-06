/**
 * React Query hooks for Points Activity Feed
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { pointsBalanceService } from "@/core/points";
import type { ActivityFeedFilters } from "@/core/points";
import { pointsQueryKeys } from "./usePointsBalances";

/**
 * Hook to fetch combined activity feed
 */
export function usePointsActivityFeed(filters?: ActivityFeedFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...pointsQueryKeys.activityFeed(), filters],
    queryFn: async () => {
      if (!user?.id) return [];
      return pointsBalanceService.getActivityFeed(user.id, filters);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}
