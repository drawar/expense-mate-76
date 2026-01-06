/**
 * React Query hooks for Points Goals
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { pointsBalanceService } from "@/core/points";
import type { PointsGoalInput, GoalStatus } from "@/core/points";
import { pointsQueryKeys } from "./usePointsBalances";
import { toast } from "sonner";

/**
 * Hook to fetch goals
 */
export function usePointsGoals(rewardCurrencyId?: string, status?: GoalStatus) {
  const { user } = useAuth();

  return useQuery({
    queryKey: pointsQueryKeys.goals(rewardCurrencyId, status),
    queryFn: async () => {
      if (!user?.id) return [];
      return pointsBalanceService.getGoals(user.id, rewardCurrencyId, status);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for active goals only
 */
export function useActiveGoals(rewardCurrencyId?: string) {
  return usePointsGoals(rewardCurrencyId, "active");
}

/**
 * Hook for goal mutations
 */
export function usePointsGoalMutations() {
  const queryClient = useQueryClient();

  const addGoal = useMutation({
    mutationFn: (input: PointsGoalInput) => pointsBalanceService.addGoal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.goals() });
      toast.success("Goal created");
    },
    onError: (error) => {
      console.error("Error adding goal:", error);
      toast.error("Failed to create goal");
    },
  });

  const updateGoal = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<PointsGoalInput> & { status?: GoalStatus };
    }) => pointsBalanceService.updateGoal(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.goals() });
      toast.success("Goal updated");
    },
    onError: (error) => {
      console.error("Error updating goal:", error);
      toast.error("Failed to update goal");
    },
  });

  const completeGoal = useMutation({
    mutationFn: (id: string) =>
      pointsBalanceService.updateGoal(id, { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.goals() });
      toast.success("Goal completed!");
    },
    onError: (error) => {
      console.error("Error completing goal:", error);
      toast.error("Failed to complete goal");
    },
  });

  const cancelGoal = useMutation({
    mutationFn: (id: string) =>
      pointsBalanceService.updateGoal(id, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.goals() });
      toast.success("Goal cancelled");
    },
    onError: (error) => {
      console.error("Error cancelling goal:", error);
      toast.error("Failed to cancel goal");
    },
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) => pointsBalanceService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointsQueryKeys.goals() });
      toast.success("Goal deleted");
    },
    onError: (error) => {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    },
  });

  return {
    addGoal,
    updateGoal,
    completeGoal,
    cancelGoal,
    deleteGoal,
  };
}
