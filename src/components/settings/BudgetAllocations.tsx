import { useEffect, useState } from "react";
import { Loader2, RotateCcwIcon, TargetIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useBudgetAllocationMutations,
  useBudgetAllocations,
} from "@/hooks/useBudgetAllocations";
import {
  PARENT_CATEGORY_IDS,
  type ParentCategoryId,
} from "@/utils/budget/defaults";
import { PARENT_CATEGORIES } from "@/utils/constants/categories";
import { CategoryIcon, type CategoryIconName } from "@/utils/constants/icons";

/**
 * Settings section for per-parent-category budget percentages.
 *
 * Percentages drive the per-category dollar budgets that are computed each
 * time a salary income is added (see useRecurringIncome → budget_periods).
 * Sums ≤ 100 are valid; the unallocated remainder counts as implicit savings.
 * Sums > 100 warn but are still saved so the user isn't blocked mid-edit.
 */
export function BudgetAllocations() {
  const { allocations, totalPct, isValid, isLoading } = useBudgetAllocations();
  const { setAllocation, resetAllocations } = useBudgetAllocationMutations();

  // Local draft mirrors the persisted allocations so the input can accept
  // in-progress typing without every keystroke round-tripping to the DB.
  const [draft, setDraft] = useState<Record<ParentCategoryId, string>>(
    () =>
      Object.fromEntries(
        PARENT_CATEGORY_IDS.map((id) => [id, String(allocations[id])])
      ) as Record<ParentCategoryId, string>
  );

  // Reconcile draft with persisted values when they load / change externally.
  useEffect(() => {
    if (isLoading) return;
    setDraft(
      Object.fromEntries(
        PARENT_CATEGORY_IDS.map((id) => [id, String(allocations[id])])
      ) as Record<ParentCategoryId, string>
    );
  }, [allocations, isLoading]);

  const draftTotal = PARENT_CATEGORY_IDS.reduce((sum, id) => {
    const n = Number(draft[id]);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const commit = (parentId: ParentCategoryId) => {
    const n = Number(draft[parentId]);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      // Snap back to persisted value on invalid entry.
      setDraft((d) => ({ ...d, [parentId]: String(allocations[parentId]) }));
      return;
    }
    if (n === allocations[parentId]) return;
    setAllocation.mutate({ parentId, percentage: n });
  };

  const remaining = 100 - draftTotal;
  const totalBadgeVariant: "secondary" | "destructive" =
    draftTotal <= 100 ? "secondary" : "destructive";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TargetIcon className="h-5 w-5" />
          Budget Allocations
        </CardTitle>
        <CardDescription>
          Set the percentage of each paycheck that should go to each spending
          category. When you add a Salary or Paycheck income, we compute a
          budget per category for that pay period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading allocations...
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {PARENT_CATEGORIES.map((parent) => (
              <div
                key={parent.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon
                    iconName={parent.icon as CategoryIconName}
                    size={20}
                    color={parent.color}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {parent.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {parent.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step={1}
                    className="w-20 text-right"
                    value={draft[parent.id as ParentCategoryId] ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        [parent.id as ParentCategoryId]: e.target.value,
                      }))
                    }
                    onBlur={() => commit(parent.id as ParentCategoryId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        commit(parent.id as ParentCategoryId);
                    }}
                    disabled={setAllocation.isPending}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Total</span>
                <Badge variant={totalBadgeVariant}>
                  {draftTotal.toFixed(0)}%
                </Badge>
                {remaining > 0 && remaining <= 100 && (
                  <span className="text-xs text-muted-foreground">
                    {remaining.toFixed(0)}% unallocated (treated as savings)
                  </span>
                )}
                {!isValid && (
                  <span className="text-xs text-destructive">
                    Over 100% — budgets will exceed your paycheck
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetAllocations.mutate()}
                disabled={resetAllocations.isPending}
              >
                <RotateCcwIcon className="h-4 w-4 mr-2" />
                Reset to defaults
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
