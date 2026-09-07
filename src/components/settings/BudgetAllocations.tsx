import { useEffect, useState } from "react";
import {
  Loader2,
  PiggyBankIcon,
  RotateCcwIcon,
  TargetIcon,
} from "lucide-react";

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
  SAVINGS_ID,
  type ParentCategoryId,
  type SavingsId,
} from "@/utils/budget/defaults";
import { PARENT_CATEGORIES } from "@/utils/constants/categories";
import { CategoryIcon, type CategoryIconName } from "@/utils/constants/icons";

type SlotId = ParentCategoryId | SavingsId;

/**
 * Settings section for budget percentages — pay-yourself-first framing.
 *
 * A prominent Savings row sits at the top of the card; the six spending
 * parent categories follow below a divider. Sum of (savings + spending)
 * ≤ 100. Unallocated remainder counts as extra implicit savings; sums
 * above 100 warn but still save so the user isn't blocked mid-edit.
 */
export function BudgetAllocations() {
  const { savings, allocations, isValid, isLoading } = useBudgetAllocations();
  const { setAllocation, resetAllocations } = useBudgetAllocationMutations();

  // Local draft mirrors the persisted values so inputs accept in-progress
  // typing without every keystroke round-tripping to the DB.
  const [draft, setDraft] = useState<Record<SlotId, string>>(() => ({
    [SAVINGS_ID]: String(savings),
    ...(Object.fromEntries(
      PARENT_CATEGORY_IDS.map((id) => [id, String(allocations[id])])
    ) as Record<ParentCategoryId, string>),
  }));

  useEffect(() => {
    if (isLoading) return;
    setDraft({
      [SAVINGS_ID]: String(savings),
      ...(Object.fromEntries(
        PARENT_CATEGORY_IDS.map((id) => [id, String(allocations[id])])
      ) as Record<ParentCategoryId, string>),
    });
  }, [savings, allocations, isLoading]);

  const draftSavings = Number(draft[SAVINGS_ID]);
  const draftSpending = PARENT_CATEGORY_IDS.reduce((sum, id) => {
    const n = Number(draft[id]);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  const draftTotal =
    (Number.isFinite(draftSavings) ? draftSavings : 0) + draftSpending;

  const persistedFor = (id: SlotId): number =>
    id === SAVINGS_ID ? savings : allocations[id as ParentCategoryId];

  const commit = (slotId: SlotId) => {
    const n = Number(draft[slotId]);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      setDraft((d) => ({ ...d, [slotId]: String(persistedFor(slotId)) }));
      return;
    }
    if (n === persistedFor(slotId)) return;
    setAllocation.mutate({ parentId: slotId, percentage: n });
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
          Pay yourself first: set a savings % that comes off the top of each
          paycheck, then split the rest across spending categories. We compute
          per-category dollar budgets each time you add a Salary or Paycheck
          income.
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
            {/* Pay-yourself-first: Savings row at the top */}
            <div className="flex items-center justify-between gap-4 rounded-lg bg-[var(--color-accent-subtle)] p-3">
              <div className="flex items-center gap-3 min-w-0">
                <PiggyBankIcon
                  className="h-5 w-5"
                  style={{ color: "var(--color-success)" }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">Savings</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Set aside first — comes off the top of every paycheck
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
                  value={draft[SAVINGS_ID] ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [SAVINGS_ID]: e.target.value }))
                  }
                  onBlur={() => commit(SAVINGS_ID)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit(SAVINGS_ID);
                  }}
                  disabled={setAllocation.isPending}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            {/* Divider between savings and the six spending categories */}
            <div className="pt-1 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
              Spending categories
            </div>

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
                    {remaining.toFixed(0)}% unallocated (extra implicit savings)
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
