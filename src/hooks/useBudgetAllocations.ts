/**
 * React-query hook for the user's per-parent-category budget percentages.
 *
 * Read: merges any persisted budget_allocations rows over DEFAULT_ALLOCATIONS,
 * so a fresh user has a full 100%-sum baseline without any DB writes.
 * Write: `setAllocation` upserts a single (user, parent_category_id) row;
 * `resetAllocations` deletes all rows for the user (fall-through to defaults).
 *
 * Sums > 100 are surfaced via the returned `isValid` flag but are not blocked
 * at write time — the settings UI shows a warning and lets the user save.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_ALLOCATIONS,
  PARENT_CATEGORY_IDS,
  type ParentCategoryId,
} from "@/utils/budget/defaults";

export const budgetAllocationsKey = (userId?: string) =>
  ["budget_allocations", userId ?? "anon"] as const;

interface UseBudgetAllocationsResult {
  allocations: Record<ParentCategoryId, number>;
  totalPct: number;
  isValid: boolean; // sum ≤ 100 (implicit savings when < 100)
  isLoading: boolean;
}

export function useBudgetAllocations(): UseBudgetAllocationsResult {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: budgetAllocationsKey(user?.id),
    queryFn: async (): Promise<Record<ParentCategoryId, number>> => {
      if (!user?.id) return { ...DEFAULT_ALLOCATIONS };

      const { data, error } = await supabase
        .from("budget_allocations")
        .select("parent_category_id, percentage")
        .eq("user_id", user.id);
      if (error) throw error;

      const merged: Record<ParentCategoryId, number> = {
        ...DEFAULT_ALLOCATIONS,
      };
      for (const row of data ?? []) {
        if (
          (PARENT_CATEGORY_IDS as readonly string[]).includes(
            row.parent_category_id
          )
        ) {
          merged[row.parent_category_id as ParentCategoryId] = Number(
            row.percentage
          );
        }
      }
      return merged;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  const allocations = query.data ?? { ...DEFAULT_ALLOCATIONS };
  const totalPct = Object.values(allocations).reduce((a, b) => a + b, 0);

  return {
    allocations,
    totalPct,
    isValid: totalPct <= 100,
    isLoading: query.isLoading,
  };
}

interface SetAllocationInput {
  parentId: ParentCategoryId;
  percentage: number;
}

export function useBudgetAllocationMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const setAllocation = useMutation({
    mutationFn: async ({ parentId, percentage }: SetAllocationInput) => {
      if (!user?.id) throw new Error("Not signed in");
      const pct = Math.max(0, Math.min(100, Number(percentage)));
      const { error } = await supabase.from("budget_allocations").upsert(
        {
          user_id: user.id,
          parent_category_id: parentId,
          percentage: pct,
        },
        { onConflict: "user_id,parent_category_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: budgetAllocationsKey(user?.id),
      });
    },
    onError: (error) => {
      console.error("Error saving budget allocation:", error);
      toast.error("Failed to save allocation");
    },
  });

  const resetAllocations = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not signed in");
      const { error } = await supabase
        .from("budget_allocations")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: budgetAllocationsKey(user?.id),
      });
      toast.success("Allocations reset to defaults");
    },
    onError: (error) => {
      console.error("Error resetting budget allocations:", error);
      toast.error("Failed to reset allocations");
    },
  });

  return { setAllocation, resetAllocations };
}
