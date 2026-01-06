/**
 * React Query hooks for Points Redemptions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { pointsBalanceService } from "@/core/points";
import type { PointsRedemptionInput } from "@/core/points";
import { pointsQueryKeys } from "./usePointsBalances";
import { toast } from "sonner";

/**
 * Hook to fetch redemptions
 */
export function usePointsRedemptions(rewardCurrencyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: pointsQueryKeys.redemptions(rewardCurrencyId),
    queryFn: async () => {
      if (!user?.id) return [];
      return pointsBalanceService.getRedemptions(user.id, rewardCurrencyId);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for average CPP
 */
export function useAverageCpp(rewardCurrencyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...pointsQueryKeys.redemptions(rewardCurrencyId), "avgCpp"],
    queryFn: async () => {
      if (!user?.id) return 0;
      return pointsBalanceService.getAverageCpp(user.id, rewardCurrencyId);
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for redemption mutations
 */
export function usePointsRedemptionMutations() {
  const queryClient = useQueryClient();

  const addRedemption = useMutation({
    mutationFn: (input: PointsRedemptionInput) =>
      pointsBalanceService.addRedemption(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.all });
      toast.success("Redemption logged");
    },
    onError: (error) => {
      console.error("Error adding redemption:", error);
      toast.error("Failed to log redemption");
    },
  });

  const updateRedemption = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<PointsRedemptionInput>;
    }) => pointsBalanceService.updateRedemption(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.all });
      toast.success("Redemption updated");
    },
    onError: (error) => {
      console.error("Error updating redemption:", error);
      toast.error("Failed to update redemption");
    },
  });

  const deleteRedemption = useMutation({
    mutationFn: (id: string) => pointsBalanceService.deleteRedemption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.all });
      toast.success("Redemption deleted");
    },
    onError: (error) => {
      console.error("Error deleting redemption:", error);
      toast.error("Failed to delete redemption");
    },
  });

  return {
    addRedemption,
    updateRedemption,
    deleteRedemption,
  };
}
