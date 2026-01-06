/**
 * React Query hooks for Points Transfers
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { pointsBalanceService } from "@/core/points";
import type { PointsTransferInput } from "@/core/points";
import { pointsQueryKeys } from "./usePointsBalances";
import { toast } from "sonner";

/**
 * Hook to fetch transfers
 */
export function usePointsTransfers(rewardCurrencyId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: pointsQueryKeys.transfers(rewardCurrencyId),
    queryFn: async () => {
      if (!user?.id) return [];
      return pointsBalanceService.getTransfers(user.id, rewardCurrencyId);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for transfer mutations
 */
export function usePointsTransferMutations() {
  const queryClient = useQueryClient();

  const addTransfer = useMutation({
    mutationFn: (input: PointsTransferInput) =>
      pointsBalanceService.addTransfer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.all });
      toast.success("Transfer recorded");
    },
    onError: (error) => {
      console.error("Error adding transfer:", error);
      toast.error("Failed to record transfer");
    },
  });

  const deleteTransfer = useMutation({
    mutationFn: (id: string) => pointsBalanceService.deleteTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.all });
      toast.success("Transfer deleted");
    },
    onError: (error) => {
      console.error("Error deleting transfer:", error);
      toast.error("Failed to delete transfer");
    },
  });

  return {
    addTransfer,
    deleteTransfer,
  };
}
