/**
 * React Query hooks for Points Adjustments
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { pointsBalanceService } from "@/core/points";
import type { PointsAdjustmentInput } from "@/core/points";
import { pointsQueryKeys } from "./usePointsBalances";
import { toast } from "sonner";

/**
 * Hook to fetch adjustments
 */
export function usePointsAdjustments(rewardCurrencyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: pointsQueryKeys.adjustments(rewardCurrencyId),
    queryFn: async () => {
      if (!user?.id) return [];
      return pointsBalanceService.getAdjustments(user.id, rewardCurrencyId);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch pending (future-dated) adjustments
 */
export function usePendingAdjustments(rewardCurrencyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: pointsQueryKeys.pendingAdjustments(rewardCurrencyId),
    queryFn: async () => {
      if (!user?.id) return [];
      return pointsBalanceService.getPendingAdjustments(
        user.id,
        rewardCurrencyId
      );
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for adjustment mutations
 */
export function usePointsAdjustmentMutations() {
  const queryClient = useQueryClient();

  const addAdjustment = useMutation({
    mutationFn: (input: PointsAdjustmentInput) =>
      pointsBalanceService.addAdjustment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.all });
      toast.success("Adjustment added");
    },
    onError: (error) => {
      console.error("Error adding adjustment:", error);
      toast.error("Failed to add adjustment");
    },
  });

  const updateAdjustment = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<PointsAdjustmentInput>;
    }) => pointsBalanceService.updateAdjustment(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.all });
      toast.success("Adjustment updated");
    },
    onError: (error) => {
      console.error("Error updating adjustment:", error);
      toast.error("Failed to update adjustment");
    },
  });

  const deleteAdjustment = useMutation({
    mutationFn: (id: string) => pointsBalanceService.deleteAdjustment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.all });
      toast.success("Adjustment deleted");
    },
    onError: (error) => {
      console.error("Error deleting adjustment:", error);
      toast.error("Failed to delete adjustment");
    },
  });

  return {
    addAdjustment,
    updateAdjustment,
    deleteAdjustment,
  };
}
