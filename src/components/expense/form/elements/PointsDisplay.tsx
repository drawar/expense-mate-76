import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CoinsIcon } from "lucide-react";
import { PaymentMethod } from "@/types";
import { useFormContext } from "react-hook-form";

interface PointsDisplayProps {
  paymentMethod: PaymentMethod | null;
  // Calculation result from useExpenseForm (single source of truth)
  calculationResult: {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    pointsCurrency?: string;
    messages?: string[];
  } | null;
  // Edit mode props
  isEditMode?: boolean;
  editablePoints?: number;
  onPointsChange?: (points: number) => void;
}

export const PointsDisplay = ({
  paymentMethod,
  calculationResult,
  isEditMode = false,
  editablePoints,
  onPointsChange,
}) => {
  // Always call useFormContext, but only use it in edit mode
  const form = useFormContext();
  const shouldUseForm = isEditMode && form;

  // Use calculation result directly - no local state or calculation needed
  const points = calculationResult;

  if (!paymentMethod || !points) {
    return null;
  }

  // Edit mode: show editable field with calculated reference
  if (shouldUseForm) {
    const error = form.formState.errors.rewardPoints;

    return (
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-800">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="rewardPoints" className="flex items-center gap-2">
              <CoinsIcon
                className="h-4 w-4 text-emerald-600"
                style={{ strokeWidth: 2.5 }}
              />
              <span className="font-medium text-emerald-900 dark:text-emerald-100">
                Reward Points
              </span>
            </Label>

            <Input
              id="rewardPoints"
              type="text"
              placeholder="0.00"
              {...form.register("rewardPoints")}
              className={error ? "border-red-500" : ""}
            />

            {error && (
              <p className="text-sm text-red-500">{error.message as string}</p>
            )}
          </div>

          {/* Calculated reference */}
          {points ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Calculated: {points.totalPoints.toLocaleString()}{" "}
                {points.pointsCurrency}
              </p>
              {points.bonusPoints > 0 && (
                <p className="text-xs text-green-600">
                  (Base: {points.basePoints} + Bonus: {points.bonusPoints})
                </p>
              )}
              {points.remainingMonthlyBonusPoints !== undefined &&
                points.remainingMonthlyBonusPoints < 1000 && (
                  <p className="text-xs text-amber-600 font-medium">
                    ⚠️ Only {points.remainingMonthlyBonusPoints} bonus points
                    remaining this month
                  </p>
                )}
              {points.remainingMonthlyBonusPoints === 0 && (
                <p className="text-xs text-red-600 font-medium">
                  🚫 Monthly bonus cap reached
                </p>
              )}
            </div>
          ) : null}

          {points && points.messages && points.messages.length > 0 && (
            <div className="text-xs text-gray-600">
              {points.messages.map((message, index) => (
                <div key={index}>{message}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Display mode: show calculated points only
  return (
    <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-800">
      <CardContent className="p-4 h-fit">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CoinsIcon
              className="h-5 w-5 text-emerald-600"
              style={{ strokeWidth: 2.5 }}
            />
            <span className="font-medium text-emerald-900 dark:text-emerald-100">
              Reward Points
            </span>
          </div>

          {points ? (
            <div className="flex items-center space-x-2">
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              >
                {points.totalPoints.toLocaleString()} {points.pointsCurrency}
              </Badge>
              {points.bonusPoints > 0 && (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  +{points.bonusPoints} bonus
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-gray-500">No points</span>
          )}
        </div>

        {points &&
          (points.messages?.length > 0 ||
            (points.remainingMonthlyBonusPoints !== undefined &&
              points.remainingMonthlyBonusPoints <= 1000)) && (
            <div className="mt-2 space-y-1">
              {points.messages && points.messages.length > 0 && (
                <div className="text-xs text-gray-600">
                  {points.messages.map((message, index) => (
                    <div key={index}>{message}</div>
                  ))}
                </div>
              )}
              {points.remainingMonthlyBonusPoints !== undefined &&
                points.remainingMonthlyBonusPoints < 1000 &&
                points.remainingMonthlyBonusPoints > 0 && (
                  <div className="text-xs text-amber-600 font-medium">
                    ⚠️ Only {points.remainingMonthlyBonusPoints} bonus points
                    remaining this month
                  </div>
                )}
              {points.remainingMonthlyBonusPoints === 0 && (
                <div className="text-xs text-red-600 font-medium">
                  🚫 Monthly bonus cap reached
                </div>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default PointsDisplay;
