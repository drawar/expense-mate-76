import { useState, useCallback, useEffect } from "react";
import { PaymentMethod, Currency, MerchantCategoryCode } from "@/types";
import { rewardService } from "@/core/rewards/RewardService";

/**
 * A single portion of a split payment with calculated points
 */
export interface SplitPortion {
  id: string;
  paymentMethodId: string;
  amount: number; // Amount in transaction currency
  paymentAmount?: number; // Amount in payment method currency (for FX)
  paymentCurrency?: Currency;
  // Calculated points
  rewardPoints: number;
  basePoints: number;
  bonusPoints: number;
  pointsCurrency?: string;
}

interface UseSplitPaymentProps {
  paymentMethods: PaymentMethod[];
  totalAmount: number;
  currency: Currency;
  merchantName?: string;
  mcc?: MerchantCategoryCode | null;
  isOnline: boolean;
  isContactless: boolean;
}

interface UseSplitPaymentReturn {
  isSplitMode: boolean;
  setIsSplitMode: (enabled: boolean) => void;
  portions: SplitPortion[];
  addPortion: () => void;
  removePortion: (id: string) => void;
  updatePortion: (id: string, updates: Partial<SplitPortion>) => void;
  remainingAmount: number;
  isValid: boolean;
  validationError: string | null;
  totalPoints: number;
  resetPortions: () => void;
}

/**
 * Hook to manage split payment functionality
 */
export function useSplitPayment({
  paymentMethods,
  totalAmount,
  currency,
  merchantName,
  mcc,
  isOnline,
  isContactless,
}: UseSplitPaymentProps): UseSplitPaymentReturn {
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [portions, setPortions] = useState<SplitPortion[]>([]);

  // Create a default portion
  const createDefaultPortion = useCallback((): SplitPortion => {
    const availableMethods = paymentMethods.filter((pm) => pm.active !== false);
    const usedMethodIds = portions.map((p) => p.paymentMethodId);
    const unusedMethods = availableMethods.filter(
      (pm) => !usedMethodIds.includes(pm.id)
    );
    const defaultMethod =
      unusedMethods.length > 0 ? unusedMethods[0] : availableMethods[0];

    return {
      id: crypto.randomUUID(),
      paymentMethodId: defaultMethod?.id || "",
      amount: 0,
      rewardPoints: 0,
      basePoints: 0,
      bonusPoints: 0,
    };
  }, [paymentMethods, portions]);

  // Initialize with two portions when split mode is enabled
  useEffect(() => {
    if (isSplitMode && portions.length === 0) {
      const portion1 = createDefaultPortion();
      // Get second available method
      const usedIds = [portion1.paymentMethodId];
      const availableMethods = paymentMethods.filter(
        (pm) => pm.active !== false && !usedIds.includes(pm.id)
      );
      const portion2: SplitPortion = {
        id: crypto.randomUUID(),
        paymentMethodId: availableMethods[0]?.id || "",
        amount: 0,
        rewardPoints: 0,
        basePoints: 0,
        bonusPoints: 0,
      };
      setPortions([portion1, portion2]);
    } else if (!isSplitMode) {
      setPortions([]);
    }
  }, [isSplitMode, paymentMethods, createDefaultPortion]);

  // Calculate points for a portion
  const calculatePortionPoints = useCallback(
    async (
      portion: SplitPortion,
      paymentMethod: PaymentMethod
    ): Promise<{
      rewardPoints: number;
      basePoints: number;
      bonusPoints: number;
      pointsCurrency?: string;
    }> => {
      if (portion.amount <= 0 || !paymentMethod) {
        return { rewardPoints: 0, basePoints: 0, bonusPoints: 0 };
      }

      try {
        // Determine converted amount for FX
        const needsConversion = paymentMethod.currency !== currency;
        let convertedAmount: number | undefined;
        let convertedCurrency: string | undefined;

        if (needsConversion) {
          convertedCurrency = paymentMethod.currency;
          if (portion.paymentAmount && portion.paymentAmount > 0) {
            convertedAmount = portion.paymentAmount;
          } else if (
            paymentMethod.conversionRate &&
            paymentMethod.conversionRate[currency]
          ) {
            const rate = paymentMethod.conversionRate[currency];
            convertedAmount = portion.amount * rate;
          }
        }

        const result = await rewardService.simulateRewards(
          portion.amount,
          currency,
          paymentMethod,
          mcc?.code,
          merchantName,
          isOnline,
          isContactless,
          convertedAmount,
          convertedCurrency
        );

        return {
          rewardPoints: result.totalPoints,
          basePoints: result.basePoints || 0,
          bonusPoints: result.bonusPoints || 0,
          pointsCurrency: result.pointsCurrency,
        };
      } catch (error) {
        console.error("Error calculating portion points:", error);
        return { rewardPoints: 0, basePoints: 0, bonusPoints: 0 };
      }
    },
    [currency, mcc?.code, merchantName, isOnline, isContactless]
  );

  // Recalculate points when dependencies change
  useEffect(() => {
    const recalculateAllPoints = async () => {
      if (!isSplitMode || portions.length === 0) return;

      const updatedPortions = await Promise.all(
        portions.map(async (portion) => {
          const paymentMethod = paymentMethods.find(
            (pm) => pm.id === portion.paymentMethodId
          );
          if (!paymentMethod) return portion;

          const points = await calculatePortionPoints(portion, paymentMethod);
          return {
            ...portion,
            ...points,
          };
        })
      );

      // Only update if points changed to avoid infinite loop
      const hasChanges = updatedPortions.some((updated, i) => {
        const original = portions[i];
        return (
          updated.rewardPoints !== original.rewardPoints ||
          updated.basePoints !== original.basePoints ||
          updated.bonusPoints !== original.bonusPoints
        );
      });

      if (hasChanges) {
        setPortions(updatedPortions);
      }
    };

    recalculateAllPoints();
  }, [
    isSplitMode,
    paymentMethods,
    mcc?.code,
    merchantName,
    isOnline,
    isContactless,
    currency,
    // Note: Don't include portions or calculatePortionPoints to avoid infinite loop
  ]);

  // Add a new portion
  const addPortion = useCallback(() => {
    setPortions((prev) => [...prev, createDefaultPortion()]);
  }, [createDefaultPortion]);

  // Remove a portion
  const removePortion = useCallback((id: string) => {
    setPortions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Update a portion and recalculate its points
  const updatePortion = useCallback(
    async (id: string, updates: Partial<SplitPortion>) => {
      setPortions((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;

          const updatedPortion = { ...p, ...updates };

          // If payment method or amount changed, recalculate points
          if (
            updates.paymentMethodId !== undefined ||
            updates.amount !== undefined ||
            updates.paymentAmount !== undefined
          ) {
            const paymentMethod = paymentMethods.find(
              (pm) => pm.id === updatedPortion.paymentMethodId
            );
            if (paymentMethod && updatedPortion.amount > 0) {
              // Calculate points asynchronously and update
              calculatePortionPoints(updatedPortion, paymentMethod).then(
                (points) => {
                  setPortions((current) =>
                    current.map((cp) =>
                      cp.id === id ? { ...cp, ...points } : cp
                    )
                  );
                }
              );
            }
          }

          return updatedPortion;
        })
      );
    },
    [paymentMethods, calculatePortionPoints]
  );

  // Reset portions
  const resetPortions = useCallback(() => {
    setPortions([]);
    if (isSplitMode) {
      // Reinitialize with two empty portions
      const portion1 = createDefaultPortion();
      const usedIds = [portion1.paymentMethodId];
      const availableMethods = paymentMethods.filter(
        (pm) => pm.active !== false && !usedIds.includes(pm.id)
      );
      const portion2: SplitPortion = {
        id: crypto.randomUUID(),
        paymentMethodId: availableMethods[0]?.id || "",
        amount: 0,
        rewardPoints: 0,
        basePoints: 0,
        bonusPoints: 0,
      };
      setPortions([portion1, portion2]);
    }
  }, [isSplitMode, paymentMethods, createDefaultPortion]);

  // Calculate remaining amount
  const usedAmount = portions.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingAmount = totalAmount - usedAmount;

  // Calculate total points
  const totalPoints = portions.reduce((sum, p) => sum + p.rewardPoints, 0);

  // Validation
  let validationError: string | null = null;
  const tolerance = 0.01; // Allow small floating point differences

  if (isSplitMode) {
    if (portions.length < 2) {
      validationError = "At least 2 payment methods required";
    } else if (portions.some((p) => !p.paymentMethodId)) {
      validationError = "Select payment method for each portion";
    } else if (portions.some((p) => p.amount <= 0)) {
      validationError = "Enter amount for each portion";
    } else if (Math.abs(remainingAmount) > tolerance) {
      if (remainingAmount > 0) {
        validationError = `$${remainingAmount.toFixed(2)} remaining to allocate`;
      } else {
        validationError = `Portions exceed total by $${Math.abs(remainingAmount).toFixed(2)}`;
      }
    }
  }

  const isValid = isSplitMode ? validationError === null : true;

  return {
    isSplitMode,
    setIsSplitMode,
    portions,
    addPortion,
    removePortion,
    updatePortion,
    remainingAmount,
    isValid,
    validationError,
    totalPoints,
    resetPortions,
  };
}
