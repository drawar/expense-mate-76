import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CoinsIcon } from "lucide-react";
import { PaymentMethod } from "@/types";
import { rewardService } from "@/core/rewards";
import { useFormContext } from "react-hook-form";

interface PointsDisplayProps {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod | null;
  mcc?: string;
  merchantName?: string;
  isOnline?: boolean;
  isContactless?: boolean;
  convertedAmount?: number;
  convertedCurrency?: string;
  // New props for edit mode
  isEditMode?: boolean;
  editablePoints?: number; // Current value in the editable field
  onPointsChange?: (points: number) => void; // Callback when user edits
}

export const PointsDisplay = ({
  amount,
  currency,
  paymentMethod,
  mcc,
  merchantName,
  isOnline,
  isContactless,
  convertedAmount,
  convertedCurrency,
  isEditMode = false,
  editablePoints,
  onPointsChange,
}) => {
  // Always call useFormContext, but only use it in edit mode
  const form = useFormContext();
  const shouldUseForm = isEditMode && form;
  const [points, setPoints] = useState<{
    totalPoints: number;
    basePoints: number;
    bonusPoints: number;
    pointsCurrency: string;
    messages?: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const calculatePoints = async () => {
      if (!paymentMethod || !amount || amount <= 0) {
        setPoints(null);
        return;
      }

      setIsLoading(true);
      try {
        console.log("[PointsDisplay] Calculating for:", {
          amount,
          currency,
          paymentMethodId: paymentMethod.id,
          paymentMethodName: paymentMethod.name,
          mcc,
          merchantName,
          isOnline,
          isContactless,
          convertedAmount,
          convertedCurrency,
        });

        const result = await rewardService.simulateRewards(
          amount,
          currency,
          paymentMethod,
          mcc,
          merchantName,
          isOnline,
          isContactless,
          convertedAmount,
          convertedCurrency
        );

        console.log("[PointsDisplay] Calculation result:", result);

        setPoints({
          totalPoints: result.totalPoints,
          basePoints: result.basePoints,
          bonusPoints: result.bonusPoints,
          pointsCurrency: result.pointsCurrency,
          messages: result.messages,
        });
      } catch (error) {
        console.error("Error calculating points in PointsDisplay:", error);
        setPoints(null);
      } finally {
        setIsLoading(false);
      }
    };

    calculatePoints();
  }, [
    amount,
    currency,
    paymentMethod,
    mcc,
    merchantName,
    isOnline,
    isContactless,
    convertedAmount,
    convertedCurrency,
  ]);

  if (!paymentMethod || !amount || amount <= 0) {
    return null;
  }

  // Edit mode: show editable field with calculated reference
  if (shouldUseForm) {
    const error = form.formState.errors.rewardPoints;

    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="rewardPoints" className="flex items-center gap-2">
              <CoinsIcon className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Reward Points</span>
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
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          ) : points ? (
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
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CoinsIcon className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Reward Points</span>
          </div>

          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          ) : points ? (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
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

        {points && points.messages && points.messages.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            {points.messages.map((message, index) => (
              <div key={index}>{message}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsDisplay;
