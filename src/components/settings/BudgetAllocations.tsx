import { useEffect, useMemo, useState } from "react";
import {
  CheckIcon,
  Loader2,
  PiggyBankIcon,
  RotateCcwIcon,
  TargetIcon,
  XIcon,
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

const SLOT_IDS: readonly SlotId[] = [SAVINGS_ID, ...PARENT_CATEGORY_IDS];

/**
 * Settings section for budget percentages — pay-yourself-first framing with
 * explicit save. Drafts live in local state; nothing hits the DB until the
 * user clicks Save. Save is disabled when nothing has changed or when the
 * total exceeds 100 — this prevents the persisted state from drifting into
 * an over-allocated shape.
 */
export function BudgetAllocations() {
  const { savings, allocations, isLoading } = useBudgetAllocations();
  const { setAllocations, resetAllocations } = useBudgetAllocationMutations();

  const emptyDraft = (): Record<SlotId, string> =>
    ({
      [SAVINGS_ID]: String(savings),
      ...(Object.fromEntries(
        PARENT_CATEGORY_IDS.map((id) => [id, String(allocations[id])])
      ) as Record<ParentCategoryId, string>),
    }) as Record<SlotId, string>;

  const [draft, setDraft] = useState<Record<SlotId, string>>(emptyDraft);

  // Reconcile draft with persisted values on initial load and on external
  // refreshes (e.g., another device edited). We only overwrite if the user
  // has no in-progress changes, to avoid clobbering typing mid-session.
  const persistedSignature = `${savings}|${PARENT_CATEGORY_IDS.map(
    (id) => allocations[id]
  ).join("|")}`;
  useEffect(() => {
    if (isLoading) return;
    setDraft(emptyDraft());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedSignature, isLoading]);

  const persistedFor = (id: SlotId): number =>
    id === SAVINGS_ID ? savings : allocations[id as ParentCategoryId];

  const dirty = useMemo(
    () =>
      SLOT_IDS.filter((id) => {
        const n = Number(draft[id]);
        if (!Number.isFinite(n)) return false;
        return n !== persistedFor(id);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, persistedSignature]
  );

  const anyInvalidField = SLOT_IDS.some((id) => {
    const n = Number(draft[id]);
    return !Number.isFinite(n) || n < 0 || n > 100;
  });

  const draftTotal = SLOT_IDS.reduce((sum, id) => {
    const n = Number(draft[id]);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const canSave =
    dirty.length > 0 && !anyInvalidField && draftTotal <= 100 && !isLoading;

  const remaining = 100 - draftTotal;
  const totalBadgeVariant: "secondary" | "destructive" =
    draftTotal <= 100 ? "secondary" : "destructive";

  const handleSave = () => {
    setAllocations.mutate(
      dirty.map((id) => ({
        parentId: id,
        percentage: Number(draft[id]),
      }))
    );
  };

  const handleDiscard = () => setDraft(emptyDraft());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TargetIcon className="h-5 w-5" />
          Budget Allocations
        </CardTitle>
        <CardDescription>
          Pay yourself first: set a savings % that comes off the top of each
          paycheck, then split the rest across spending categories. Changes
          apply to your next salary — click Save when your split totals 100%.
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
                  disabled={setAllocations.isPending}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

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
                    disabled={setAllocations.isPending}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 pt-3 border-t sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-muted-foreground">Total</span>
                <Badge variant={totalBadgeVariant}>
                  {draftTotal.toFixed(0)}%
                </Badge>
                {draftTotal <= 100 && remaining > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {remaining.toFixed(0)}% unallocated (extra implicit savings)
                  </span>
                )}
                {draftTotal > 100 && (
                  <span className="text-xs text-destructive">
                    Over 100% — reduce a category before saving
                  </span>
                )}
                {dirty.length > 0 && draftTotal <= 100 && (
                  <span className="text-xs text-muted-foreground">
                    · {dirty.length} unsaved change
                    {dirty.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetAllocations.mutate()}
                  disabled={
                    resetAllocations.isPending || setAllocations.isPending
                  }
                >
                  <RotateCcwIcon className="h-4 w-4 mr-2" />
                  Reset to defaults
                </Button>
                {dirty.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscard}
                    disabled={setAllocations.isPending}
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Discard
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!canSave || setAllocations.isPending}
                >
                  {setAllocations.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
