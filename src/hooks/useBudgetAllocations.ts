/**
 * React-query hook for the user's budget percentages + cadence:
 *   - Pay-yourself-first savings %
 *   - Six per-parent-category spending %s
 *   - Per-category cadence flag: `per_period` (default) or `monthly` for
 *     categories with lumpy monthly bills (rent, mortgage, car loan, etc.)
 *
 * Read: merges any persisted budget_allocations rows over DEFAULT_ALLOCATIONS
 * + DEFAULT_SAVINGS_PCT + DEFAULT_CADENCE.
 *
 * Write: `setAllocation` upserts a single (user, parent_category_id) row;
 * `setAllocations` batches many rows atomically. `resetAllocations` deletes
 * all rows for the user (fall-through to defaults).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_ALLOCATIONS,
  DEFAULT_CADENCE,
  DEFAULT_SAVINGS_PCT,
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
  type Cadence,
  type ParentCategoryId,
  type SavingsId,
} from "@/utils/budget/defaults";
import { recomputeActivePeriods } from "@/utils/budget/recomputeActivePeriods";

export const budgetAllocationsKey = (userId?: string) =>
  ["budget_allocations", userId ?? "anon"] as const;

interface UseBudgetAllocationsResult {
  savings: number;
  allocations: Record<ParentCategoryId, number>;
  cadence: Record<ParentCategoryId, Cadence>;
  totalPct: number;
  isValid: boolean;
  isLoading: boolean;
}

interface QueryShape {
  savings: number;
  allocations: Record<ParentCategoryId, number>;
  cadence: Record<ParentCategoryId, Cadence>;
}

function defaults(): QueryShape {
  return {
    savings: DEFAULT_SAVINGS_PCT,
    allocations: { ...DEFAULT_ALLOCATIONS },
    cadence: { ...DEFAULT_CADENCE },
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
        .select("parent_category_id, percentage, cadence")
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
          const cat = row.parent_category_id as ParentCategoryId;
          merged.allocations[cat] = Number(row.percentage);
          if (row.cadence === "monthly" || row.cadence === "per_period") {
            merged.cadence[cat] = row.cadence;
          }
        }
      }
      return merged;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  const { savings, allocations, cadence } = query.data ?? defaults();
  const spendingTotal = Object.values(allocations).reduce((a, b) => a + b, 0);
  const totalPct = spendingTotal + savings;

  return {
    savings,
    allocations,
    cadence,
    totalPct,
    isValid: totalPct <= 100,
    isLoading: query.isLoading,
  };
}

interface SetAllocationInput {
  parentId: ParentCategoryId | SavingsId;
  percentage: number;
  /** Optional; only meaningful for parent categories, ignored for savings. */
  cadence?: Cadence;
}

export function useBudgetAllocationMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const buildRow = ({ parentId, percentage, cadence }: SetAllocationInput) => {
    const row: {
      user_id: string;
      parent_category_id: string;
      percentage: number;
      cadence?: Cadence;
    } = {
      user_id: user!.id,
      parent_category_id: parentId,
      percentage: Math.max(0, Math.min(100, Number(percentage))),
    };
    // Cadence is only stored for parent categories; savings stays default.
    if (parentId !== SAVINGS_ID && cadence) row.cadence = cadence;
    return row;
  };

  const setAllocation = useMutation({
    mutationFn: async (input: SetAllocationInput) => {
      if (!user?.id) throw new Error("Not signed in");
      const { error } = await supabase
        .from("budget_allocations")
        .upsert(buildRow(input), {
          onConflict: "user_id,parent_category_id",
        });
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

  const setAllocations = useMutation({
    mutationFn: async (inputs: SetAllocationInput[]) => {
      if (!user?.id) throw new Error("Not signed in");
      if (inputs.length === 0) return;
      const rows = inputs.map(buildRow);
      const { error } = await supabase
        .from("budget_allocations")
        .upsert(rows, { onConflict: "user_id,parent_category_id" });
      if (error) throw error;
      if (user?.id) await recomputeActivePeriods(supabase, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: budgetAllocationsKey(user?.id),
      });
      queryClient.invalidateQueries({ queryKey: ["budget_periods"] });
      toast.success("Budget allocations saved");
    },
    onError: (error) => {
      console.error("Error saving budget allocations:", error);
      toast.error("Failed to save allocations");
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
      if (user?.id) await recomputeActivePeriods(supabase, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: budgetAllocationsKey(user?.id),
      });
      queryClient.invalidateQueries({ queryKey: ["budget_periods"] });
      toast.success("Allocations reset to defaults");
    },
    onError: (error) => {
      console.error("Error resetting budget allocations:", error);
      toast.error("Failed to reset allocations");
    },
  });

  return { setAllocation, setAllocations, resetAllocations };
}
