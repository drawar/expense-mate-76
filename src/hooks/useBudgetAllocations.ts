/**
 * React-query hook for the user's budget percentages: pay-yourself-first
 * savings + six per-parent-category spending %s.
 *
 * Read: merges any persisted budget_allocations rows over
 * DEFAULT_ALLOCATIONS (+ DEFAULT_SAVINGS_PCT). A fresh user gets a
 * baseline that sums to 100% (10 savings + 90 spending) without any DB
 * writes.
 *
 * Write: `setAllocation` upserts a single (user, parent_category_id) row
 * — `parentId` may be a ParentCategoryId or the reserved "savings" slot.
 * `resetAllocations` deletes all rows for the user (fall-through to
 * defaults).
 *
 * Sums > 100 are surfaced via the returned `isValid` flag but are not
 * blocked at write time — the settings UI warns and still saves.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_ALLOCATIONS,
  DEFAULT_SAVINGS_PCT,
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
  type ParentCategoryId,
  type SavingsId,
} from "@/utils/budget/defaults";

export const budgetAllocationsKey = (userId?: string) =>
  ["budget_allocations", userId ?? "anon"] as const;

interface UseBudgetAllocationsResult {
  savings: number;
  allocations: Record<ParentCategoryId, number>;
  /** savings + spending %s combined */
  totalPct: number;
  /** true when savings + spending ≤ 100 */
  isValid: boolean;
  isLoading: boolean;
}

interface QueryShape {
  savings: number;
  allocations: Record<ParentCategoryId, number>;
}

function defaults(): QueryShape {
  return {
    savings: DEFAULT_SAVINGS_PCT,
    allocations: { ...DEFAULT_ALLOCATIONS },
  };
}

export function useBudgetAllocations(): UseBudgetAllocationsResult {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: budgetAllocationsKey(user?.id),
    queryFn: async (): Promise<QueryShape> => {
      if (!user?.id) return defaults();

      const { data, error } = await supabase
        .from("budget_allocations")
        .select("parent_category_id, percentage")
        .eq("user_id", user.id);
      if (error) throw error;

      const merged = defaults();
      for (const row of data ?? []) {
        if (row.parent_category_id === SAVINGS_ID) {
          merged.savings = Number(row.percentage);
        } else if (
          (PARENT_CATEGORY_IDS as readonly string[]).includes(
            row.parent_category_id
          )
        ) {
          merged.allocations[row.parent_category_id as ParentCategoryId] =
            Number(row.percentage);
        }
      }
      return merged;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  const { savings, allocations } = query.data ?? defaults();
  const spendingTotal = Object.values(allocations).reduce((a, b) => a + b, 0);
  const totalPct = spendingTotal + savings;

  return {
    savings,
    allocations,
    totalPct,
    isValid: totalPct <= 100,
    isLoading: query.isLoading,
  };
}

interface SetAllocationInput {
  parentId: ParentCategoryId | SavingsId;
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
