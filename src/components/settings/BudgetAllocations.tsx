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
import { Switch } from "@/components/ui/switch";
import {
  useBudgetAllocationMutations,
  useBudgetAllocations,
} from "@/hooks/useBudgetAllocations";
import {
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
  type Cadence,
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
 *
 * Each spending category also carries a "Monthly" toggle for lumpy bills:
 *   OFF → per-period cadence: budget/spent scoped to the active pay period.
 *   ON  → monthly cadence: budget summed across the calendar month, spend
 *          accumulated across the whole month. Use for rent, mortgage,
 *          car loan, insurance — anything paid once a month.
 */
export function BudgetAllocations() {
  const { savings, allocations, cadence, isLoading } = useBudgetAllocations();
  const { setAllocations, resetAllocations } = useBudgetAllocationMutations();

  const emptyPctDraft = (): Record<SlotId, string> =>
    ({
      [SAVINGS_ID]: String(savings),
      ...(Object.fromEntries(
        PARENT_CATEGORY_IDS.map((id) => [id, String(allocations[id])])
      ) as Record<ParentCategoryId, string>),
    }) as Record<SlotId, string>;

  const emptyCadenceDraft = (): Record<ParentCategoryId, Cadence> => ({
    ...cadence,
  });

  const [draft, setDraft] = useState<Record<SlotId, string>>(emptyPctDraft);
  const [cadenceDraft, setCadenceDraft] =
    useState<Record<ParentCategoryId, Cadence>>(emptyCadenceDraft);

  const persistedPctSignature = `${savings}|${PARENT_CATEGORY_IDS.map(
    (id) => allocations[id]
  ).join("|")}`;
  const persistedCadenceSignature = PARENT_CATEGORY_IDS.map(
    (id) => cadence[id]
  ).join("|");

  useEffect(() => {
    if (isLoading) return;
    setDraft(emptyPctDraft());
    setCadenceDraft(emptyCadenceDraft());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedPctSignature, persistedCadenceSignature, isLoading]);

  const persistedPctFor = (id: SlotId): number =>
    id === SAVINGS_ID ? savings : allocations[id as ParentCategoryId];

  const dirty = useMemo(() => {
    const dirtyIds: SlotId[] = [];
    for (const id of SLOT_IDS) {
      const nPct = Number(draft[id]);
      if (!Number.isFinite(nPct)) continue;
      const pctChanged = nPct !== persistedPctFor(id);
      const cadenceChanged =
        id !== SAVINGS_ID &&
        cadenceDraft[id as ParentCategoryId] !==
          cadence[id as ParentCategoryId];
      if (pctChanged || cadenceChanged) dirtyIds.push(id);
    }
    return dirtyIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, cadenceDraft, persistedPctSignature, persistedCadenceSignature]);

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
        cadence:
          id === SAVINGS_ID ? undefined : cadenceDraft[id as ParentCategoryId],
      }))
    );
  };

  const handleDiscard = () => {
    setDraft(emptyPctDraft());
    setCadenceDraft(emptyCadenceDraft());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TargetIcon className="h-5 w-5" />
          Budget Allocations
        </CardTitle>
        <CardDescription>
          Pay yourself first: set a savings % that comes off the top of each
          paycheck, then split the rest across spending categories. Toggle{" "}
          <strong>Monthly</strong> on categories with lumpy monthly bills (rent,
          mortgage, car loan) so their budget spans the calendar month instead
          of a single pay period. Changes apply to your next salary — click Save
          when your split totals 100%.
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

            {PARENT_CATEGORIES.map((parent) => {
              const catId = parent.id as ParentCategoryId;
              const isMonthly = cadenceDraft[catId] === "monthly";
              return (
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
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                      <Switch
                        checked={isMonthly}
                        onCheckedChange={(checked) =>
                          setCadenceDraft((c) => ({
                            ...c,
                            [catId]: checked ? "monthly" : "per_period",
                          }))
                        }
                        disabled={setAllocations.isPending}
                        aria-label={`${parent.name} monthly cadence`}
                      />
                      <span className={isMonthly ? "text-foreground" : ""}>
                        Monthly
                      </span>
                    </label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step={1}
                        className="w-20 text-right"
                        value={draft[catId] ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, [catId]: e.target.value }))
                        }
                        disabled={setAllocations.isPending}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              );
            })}

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
