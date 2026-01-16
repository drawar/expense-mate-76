/**
 * React Query hooks for Points Balances
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { pointsBalanceService } from "@/core/points";
import type { PointsBalanceInput, BalanceBreakdown } from "@/core/points";
import { toast } from "sonner";

// Query keys
export const pointsQueryKeys = {
  all: ["points"] as const,
  balances: () => [...pointsQueryKeys.all, "balances"] as const,
  balance: (currencyId: string) =>
    [...pointsQueryKeys.balances(), currencyId] as const,
  breakdown: (currencyId: string) =>
    [...pointsQueryKeys.balances(), "breakdown", currencyId] as const,
  adjustments: (currencyId?: string) =>
    [...pointsQueryKeys.all, "adjustments", currencyId] as const,
  pendingAdjustments: (currencyId?: string) =>
    [...pointsQueryKeys.all, "adjustments", "pending", currencyId] as const,
  redemptions: (currencyId?: string) =>
    [...pointsQueryKeys.all, "redemptions", currencyId] as const,
  transfers: (currencyId?: string) =>
    [...pointsQueryKeys.all, "transfers", currencyId] as const,
  goals: (currencyId?: string, status?: string) =>
    [...pointsQueryKeys.all, "goals", currencyId, status] as const,
  activityFeed: () => [...pointsQueryKeys.all, "activity"] as const,
};

/**
 * Hook to fetch all points balances
 */
export function usePointsBalances() {
  const { user } = useAuth();

  return useQuery({
    queryKey: pointsQueryKeys.balances(),
    queryFn: async () => {
      if (!user?.id) return [];
      return pointsBalanceService.getAllBalances(user.id);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch a single balance
 */
export function usePointsBalance(rewardCurrencyId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: pointsQueryKeys.balance(rewardCurrencyId),
    queryFn: async () => {
      if (!user?.id) return null;
      return pointsBalanceService.getBalance(user.id, rewardCurrencyId);
    },
    enabled: !!user?.id && !!rewardCurrencyId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch balance breakdown
 * @param rewardCurrencyId - The currency to fetch breakdown for
 * @param cardTypeId - @deprecated Use paymentMethodId instead. Legacy card type identifier.
 * @param paymentMethodId - The payment method UUID for card-specific balances
 */
export function useBalanceBreakdown(
  rewardCurrencyId: string,
  cardTypeId?: string,
  paymentMethodId?: string
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      ...pointsQueryKeys.breakdown(rewardCurrencyId),
      cardTypeId,
      paymentMethodId,
    ],
    queryFn: async (): Promise<BalanceBreakdown | null> => {
      if (!user?.id) return null;
      return pointsBalanceService.calculateBalanceBreakdown(
        user.id,
        rewardCurrencyId,
        cardTypeId,
        paymentMethodId
      );
    },
    enabled: !!user?.id && !!rewardCurrencyId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for balance mutations
 */
export function usePointsBalanceMutations() {
  const queryClient = useQueryClient();

  const setStartingBalance = useMutation({
    mutationFn: (input: PointsBalanceInput) =>
      pointsBalanceService.setStartingBalance(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.balances() });
      toast.success("Starting balance updated");
    },
    onError: (error) => {
      console.error("Error setting starting balance:", error);
      toast.error("Failed to update starting balance");
    },
  });

  const recalculateBalance = useMutation({
    mutationFn: ({
      userId,
      rewardCurrencyId,
    }: {
      userId: string;
      rewardCurrencyId: string;
    }) => pointsBalanceService.recalculateBalance(userId, rewardCurrencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.balances() });
    },
    onError: (error) => {
      console.error("Error recalculating balance:", error);
      toast.error("Failed to recalculate balance");
    },
  });

  return {
    setStartingBalance,
    recalculateBalance,
  };
}
