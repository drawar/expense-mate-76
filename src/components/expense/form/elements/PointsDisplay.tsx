import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  CoinsIcon,
  GiftIcon,
  ChevronDown,
  ChevronUp,
  StarIcon,
  SparklesIcon,
} from "lucide-react";
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

// Helper to parse points from form value
const parsePoints = (value: string | undefined): number => {
  if (!value || value.trim() === "") return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const PointsDisplay = ({
  paymentMethod,
  calculationResult,
  isEditMode = false,
  editablePoints,
  onPointsChange,
}: PointsDisplayProps) => {
  const form = useFormContext();
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Use calculation result directly
  const points = calculationResult;

  // Watch all points fields
  const basePointsValue = form?.watch("basePoints");
  const bonusPointsValue = form?.watch("bonusPoints");
  const promoBonusPointsValue = form?.watch("promoBonusPoints");

  // Parse values
  const basePoints = parsePoints(basePointsValue);
  const bonusPoints = parsePoints(bonusPointsValue);
  const promoBonusPoints = parsePoints(promoBonusPointsValue);

  // Calculate total from editable fields
  const calculatedTotal = basePoints + bonusPoints + promoBonusPoints;

  // Auto-expand breakdown if there are non-zero bonus values
  const hasExistingBreakdown = bonusPoints > 0 || promoBonusPoints > 0;
  const shouldShowBreakdown =
    showBreakdown || hasExistingBreakdown || isEditMode;

  // Auto-update rewardPoints (total) when any component changes
  useEffect(() => {
    if (form) {
      form.setValue("rewardPoints", calculatedTotal.toString());
    }
  }, [basePoints, bonusPoints, promoBonusPoints, form]);

  // Sync form fields with calculation result when calculation changes
  // In non-edit mode, always update form fields to match the latest calculation
  // This ensures converted amount changes are reflected in the UI
  useEffect(() => {
    if (form && points && !isEditMode) {
      // Always update form fields to match the latest calculation
      // This is critical for foreign currency transactions where the converted
      // amount may change after initial calculation
      if (points.basePoints !== undefined) {
        form.setValue("basePoints", points.basePoints.toString());
      }
      if (points.bonusPoints !== undefined) {
        form.setValue("bonusPoints", points.bonusPoints.toString());
      }
    }
  }, [points?.basePoints, points?.bonusPoints, form, isEditMode]);

  if (!paymentMethod || !points) {
    return null;
  }

  const pointsCurrency = points.pointsCurrency || "points";

  // Edit mode: show all editable fields
  if (isEditMode && form) {
    const baseError = form.formState.errors.basePoints;
    const bonusError = form.formState.errors.bonusPoints;
    const promoError = form.formState.errors.promoBonusPoints;

    return (
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-800">
        <CardContent className="p-4 space-y-4">
          {/* Total Points Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CoinsIcon
                className="h-5 w-5 text-emerald-600"
                style={{ strokeWidth: 2.5 }}
              />
              <span className="font-medium text-emerald-900 dark:text-emerald-100">
                Total Points
              </span>
            </div>
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-lg px-3 py-1"
            >
              {calculatedTotal.toLocaleString()} {pointsCurrency}
            </Badge>
          </div>

          {/* Points Breakdown - Editable */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-emerald-200 dark:border-emerald-800">
            {/* Base Points */}
            <div className="space-y-1">
              <Label
                htmlFor="basePoints"
                className="flex items-center gap-1 text-xs"
              >
                <CoinsIcon className="h-3 w-3 text-blue-600" />
                <span className="text-blue-900 dark:text-blue-100">Base</span>
              </Label>
              <Input
                id="basePoints"
                type="text"
                placeholder="0"
                {...form.register("basePoints")}
                className={`text-sm h-8 ${baseError ? "border-red-500" : ""}`}
              />
              {baseError && (
                <p className="text-xs text-red-500">
                  {baseError.message as string}
                </p>
              )}
            </div>

            {/* Bonus Points */}
            <div className="space-y-1">
              <Label
                htmlFor="bonusPoints"
                className="flex items-center gap-1 text-xs"
              >
                <StarIcon className="h-3 w-3 text-amber-600" />
                <span className="text-amber-900 dark:text-amber-100">
                  Bonus
                </span>
              </Label>
              <Input
                id="bonusPoints"
                type="text"
                placeholder="0"
                {...form.register("bonusPoints")}
                className={`text-sm h-8 ${bonusError ? "border-red-500" : ""}`}
              />
              {bonusError && (
                <p className="text-xs text-red-500">
                  {bonusError.message as string}
                </p>
              )}
            </div>

            {/* Promo Bonus Points */}
            <div className="space-y-1">
              <Label
                htmlFor="promoBonusPoints"
                className="flex items-center gap-1 text-xs"
              >
                <GiftIcon className="h-3 w-3 text-purple-600" />
                <span className="text-purple-900 dark:text-purple-100">
                  Promo
                </span>
              </Label>
              <Input
                id="promoBonusPoints"
                type="text"
                placeholder="0"
                {...form.register("promoBonusPoints")}
                className={`text-sm h-8 ${promoError ? "border-red-500" : ""}`}
              />
              {promoError && (
                <p className="text-xs text-red-500">
                  {promoError.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Calculation Reference */}
          <div className="text-xs text-muted-foreground pt-2 border-t border-emerald-200 dark:border-emerald-800">
            <p>
              Calculated: {points.basePoints || 0} base +{" "}
              {points.bonusPoints || 0} bonus = {points.totalPoints}{" "}
              {pointsCurrency}
            </p>
          </div>

          {/* Messages */}
          {points.messages && points.messages.length > 0 && (
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

  // Display mode: show total with expandable breakdown
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

          <div className="flex items-center space-x-2">
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
            >
              {calculatedTotal.toLocaleString()} {pointsCurrency}
            </Badge>
            {bonusPoints > 0 && (
              <Badge variant="default" className="bg-amber-100 text-amber-800">
                +{bonusPoints} bonus
              </Badge>
            )}
            {promoBonusPoints > 0 && (
              <Badge
                variant="default"
                className="bg-purple-100 text-purple-800"
              >
                +{promoBonusPoints} promo
              </Badge>
            )}
          </div>
        </div>

        {/* Messages and warnings */}
        {points.messages && points.messages.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            {points.messages.map((message, index) => (
              <div key={index}>{message}</div>
            ))}
          </div>
        )}

        {/* Expandable Breakdown Editor */}
        {form && (
          <div className="mt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowBreakdown(!shouldShowBreakdown)}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-0 h-auto font-normal"
            >
              <SparklesIcon className="h-4 w-4 mr-1" />
              {shouldShowBreakdown ? "Hide" : "Edit"} points breakdown
              {shouldShowBreakdown ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </Button>

            {shouldShowBreakdown && (
              <div className="mt-3 space-y-3">
                {/* Points Breakdown - Editable */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Base Points */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="basePoints"
                      className="flex items-center gap-1 text-xs"
                    >
                      <CoinsIcon className="h-3 w-3 text-blue-600" />
                      <span className="text-blue-900 dark:text-blue-100">
                        Base
                      </span>
                    </Label>
                    <Input
                      id="basePoints"
                      type="text"
                      placeholder="0"
                      {...form.register("basePoints")}
                      className="text-sm h-8"
                    />
                  </div>

                  {/* Bonus Points */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="bonusPoints"
                      className="flex items-center gap-1 text-xs"
                    >
                      <StarIcon className="h-3 w-3 text-amber-600" />
                      <span className="text-amber-900 dark:text-amber-100">
                        Bonus
                      </span>
                    </Label>
                    <Input
                      id="bonusPoints"
                      type="text"
                      placeholder="0"
                      {...form.register("bonusPoints")}
                      className="text-sm h-8"
                    />
                  </div>

                  {/* Promo Bonus Points */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="promoBonusPoints"
                      className="flex items-center gap-1 text-xs"
                    >
                      <GiftIcon className="h-3 w-3 text-purple-600" />
                      <span className="text-purple-900 dark:text-purple-100">
                        Promo
                      </span>
                    </Label>
                    <Input
                      id="promoBonusPoints"
                      type="text"
                      placeholder="0"
                      {...form.register("promoBonusPoints")}
                      className="text-sm h-8"
                    />
                  </div>
                </div>

                {/* Total calculation preview */}
                <div className="text-xs text-muted-foreground">
                  Total: {basePoints} + {bonusPoints} + {promoBonusPoints} ={" "}
                  <span className="font-medium text-emerald-700">
                    {calculatedTotal} {pointsCurrency}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsDisplay;
