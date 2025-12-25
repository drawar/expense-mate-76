import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentMethod, MerchantCategoryCode, Currency } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  FormValues,
  formSchema,
} from "@/hooks/expense/expense-form/formSchema";
import { useMerchantData } from "@/hooks/expense/expense-form/useMerchantData";
import { usePaymentMethodLogic } from "@/hooks/expense/expense-form/usePaymentMethodLogic";
import { useState, useEffect } from "react";
import { rewardService } from "@/core/rewards/RewardService";
import { CurrencyService } from "@/core/currency";

// Air France (MCC 3007) and KLM (MCC 3010) detection for Brim AF/KLM special case
const AFKLM_MCCS = ["3007", "3010"];
const AFKLM_MERCHANTS = [
  "air france",
  "airfrance",
  "klm",
  "klm airline",
  "klm royal dutch",
  "flying blue",
];

/**
 * Detect if this is a Brim AF/KLM card + AF/KLM merchant transaction
 */
function isBrimAFKLMSpecialCase(
  paymentMethod: PaymentMethod | undefined,
  merchantName: string | undefined,
  mcc: MerchantCategoryCode | null | undefined
): boolean {
  if (!paymentMethod) return false;

  const issuer = paymentMethod.issuer?.toLowerCase() || "";
  const name = paymentMethod.name?.toLowerCase() || "";
  const isBrimAFKLMCard =
    issuer.includes("brim") && name.includes("air france");

  if (!isBrimAFKLMCard) return false;

  const merchantLower = merchantName?.toLowerCase() || "";
  const isAFKLMMerchant = AFKLM_MERCHANTS.some((m) =>
    merchantLower.includes(m)
  );
  const isAFKLMMCC = mcc?.code && AFKLM_MCCS.includes(mcc.code);

  return isAFKLMMerchant || isAFKLMMCC;
}

interface UseExpenseFormProps {
  paymentMethods: PaymentMethod[];
  defaultValues?: Partial<FormValues>;
}

// Change regular export to type export
export type { FormValues } from "@/hooks/expense/expense-form/formSchema";

export interface PointsCalculationResult {
  totalPoints: number;
  basePoints?: number;
  bonusPoints?: number;
  remainingMonthlyBonusPoints?: number;
  pointsCurrency?: string;
  messageText?: string;
  messages?: string[];
}

export const useExpenseForm = ({
  paymentMethods,
  defaultValues,
}: UseExpenseFormProps) => {
  const { toast } = useToast();

  // Track calculated points (automatic calculation in background)
  const [pointsCalculation, setPointsCalculation] =
    useState<PointsCalculationResult>({
      totalPoints: 0,
      basePoints: 0,
      bonusPoints: 0,
    });

  // Track user-entered points separately
  const [enteredPoints, setEnteredPoints] = useState<number | null>(
    defaultValues?.rewardPoints ? Number(defaultValues.rewardPoints) : null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      merchantName: defaultValues?.merchantName || "",
      merchantAddress: defaultValues?.merchantAddress || "",
      isOnline: defaultValues?.isOnline ?? false,
      isContactless: defaultValues?.isContactless ?? false,
      amount: defaultValues?.amount || "",
      currency: defaultValues?.currency || CurrencyService.getDefaultCurrency(),
      paymentMethodId: defaultValues?.paymentMethodId || "",
      paymentAmount: defaultValues?.paymentAmount || "",
      eurFareAmount: defaultValues?.eurFareAmount || "",
      date: defaultValues?.date || new Date(),
      notes: defaultValues?.notes || "",
      mcc: defaultValues?.mcc || null,
      rewardPoints: defaultValues?.rewardPoints || "",
      promoBonusPoints: defaultValues?.promoBonusPoints || "",
      basePoints: defaultValues?.basePoints || "",
      bonusPoints: defaultValues?.bonusPoints || "",
    },
  });

  const merchantName = form.watch("merchantName");
  const currency = form.watch("currency");
  const amount = Number(form.watch("amount")) || 0;
  const paymentAmount = Number(form.watch("paymentAmount")) || 0;
  const eurFareAmount = Number(form.watch("eurFareAmount")) || 0;
  const isOnline = form.watch("isOnline");
  const isContactless = form.watch("isContactless");
  const paymentMethodId = form.watch("paymentMethodId");
  const rewardPointsField = form.watch("rewardPoints");

  // Initialize selectedMCC from form default values if available
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | null>(
    defaultValues?.mcc || null
  );

  // Sync selectedMCC to form's mcc field whenever it changes
  useEffect(() => {
    form.setValue("mcc", selectedMCC);
  }, [selectedMCC, form]);

  const { selectedPaymentMethod, shouldOverridePayment } =
    usePaymentMethodLogic(
      form,
      paymentMethods,
      currency as Currency,
      amount,
      isOnline
    );

  // Track changes to the reward points field
  useEffect(() => {
    if (rewardPointsField !== undefined && rewardPointsField !== "") {
      const parsed = Number(rewardPointsField);
      if (!isNaN(parsed)) {
        setEnteredPoints(parsed);
      }
    }
  }, [rewardPointsField]);

  // Calculate reward points using the reward service
  useEffect(() => {
    const calculatePoints = async () => {
      if (!selectedPaymentMethod || amount <= 0) {
        setPointsCalculation({
          totalPoints: 0,
          basePoints: 0,
          bonusPoints: 0,
        });
        return;
      }

      try {
        // Check for Brim AF/KLM special case with EUR fare amount
        const isBrimAFKLM = isBrimAFKLMSpecialCase(
          selectedPaymentMethod,
          merchantName,
          selectedMCC
        );

        if (isBrimAFKLM && currency === "CAD" && eurFareAmount > 0) {
          // Special calculation for Brim AF/KLM:
          // Bonus: EUR fare × 5
          // Base: CAD amount × 1
          const bonusPoints = Math.floor(eurFareAmount * 5);
          const basePoints = Math.floor(amount * 1);
          const totalPoints = bonusPoints + basePoints;

          console.log("🔍 [useExpenseForm] Brim AF/KLM special calculation:", {
            eurFareAmount,
            cadAmount: amount,
            bonusPoints,
            basePoints,
            totalPoints,
          });

          setPointsCalculation({
            totalPoints,
            basePoints,
            bonusPoints,
            pointsCurrency:
              selectedPaymentMethod.pointsCurrency || "Flying Blue Points",
          });

          // Update form field with calculated value (with guard to prevent loops)
          if (!defaultValues?.rewardPoints) {
            const currentValue = form.getValues("rewardPoints");
            const newValue = totalPoints.toString();
            if (currentValue !== newValue) {
              form.setValue("rewardPoints", newValue, { shouldDirty: false });
            }
          }
          return;
        }

        // Standard calculation flow
        // Determine if we need to pass converted amount
        // If payment method currency differs from transaction currency, we need to convert
        const needsConversion = selectedPaymentMethod.currency !== currency;

        let convertedAmount: number | undefined;
        let convertedCurrency: string | undefined;

        if (needsConversion) {
          convertedCurrency = selectedPaymentMethod.currency;

          // Use paymentAmount if it's set (user manually entered or auto-calculated)
          if (paymentAmount > 0) {
            convertedAmount = paymentAmount;
          } else if (
            selectedPaymentMethod.conversionRate &&
            selectedPaymentMethod.conversionRate[currency]
          ) {
            // Calculate using conversion rate if available
            const rate = selectedPaymentMethod.conversionRate[currency];
            convertedAmount = amount * rate;
          } else {
            // If no conversion rate and no payment amount, we can't convert
            // The reward calculation will use the transaction amount
            convertedAmount = undefined;
            convertedCurrency = undefined;
          }
        }

        console.log("🔍 [useExpenseForm] Calling simulateRewards with:", {
          amount,
          currency,
          paymentAmount,
          needsConversion,
          convertedAmount,
          convertedCurrency,
          paymentMethodCurrency: selectedPaymentMethod.currency,
        });

        const result = await rewardService.simulateRewards(
          amount, // Always pass the transaction amount
          currency,
          selectedPaymentMethod,
          selectedMCC?.code,
          merchantName,
          isOnline,
          isContactless,
          convertedAmount, // Pass converted amount if available
          convertedCurrency
        );

        // Format message text
        let messageText;
        if (
          result.bonusPoints === 0 &&
          result.remainingMonthlyBonusPoints === 0
        ) {
          messageText = "Monthly bonus points cap reached";
        } else if (result.bonusPoints === 0) {
          messageText = "Not eligible for bonus points";
        } else if (result.bonusPoints > 0) {
          messageText = `Earning ${result.bonusPoints} bonus points`;
        } else if (result.remainingMonthlyBonusPoints !== undefined) {
          messageText = `${result.remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month`;
        }

        setPointsCalculation({
          totalPoints: result.totalPoints,
          basePoints: result.basePoints,
          bonusPoints: result.bonusPoints,
          remainingMonthlyBonusPoints: result.remainingMonthlyBonusPoints,
          pointsCurrency: result.pointsCurrency,
          messageText,
          messages: result.messages,
        });

        // If creating a new transaction (no rewardPoints in defaultValues),
        // update the form field with calculated value (with guard to prevent loops)
        if (!defaultValues?.rewardPoints) {
          const currentValue = form.getValues("rewardPoints");
          const newValue = result.totalPoints.toString();
          if (currentValue !== newValue) {
            form.setValue("rewardPoints", newValue, { shouldDirty: false });
          }
        }
      } catch (error) {
        console.error("Error calculating reward points:", error);
        // Keep last calculation result on error
      }
    };

    calculatePoints();
  }, [
    amount,
    currency,
    selectedPaymentMethod,
    selectedMCC?.code,
    selectedMCC,
    merchantName,
    isOnline,
    isContactless,
    shouldOverridePayment,
    paymentAmount,
    eurFareAmount,
    defaultValues?.rewardPoints,
    form,
  ]);

  return {
    form,
    selectedMCC,
    setSelectedMCC,
    selectedPaymentMethod,
    shouldOverridePayment,
    pointsCalculation, // Calculated points (automatic)
    enteredPoints, // User-entered points
  };
};
