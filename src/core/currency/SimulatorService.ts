import { PaymentMethod, Currency } from "@/types";
import { RewardService } from "@/core/rewards/RewardService";
import { ConversionService } from "./ConversionService";
import { ExchangeRateService } from "./ExchangeRateService";
import { CalculationInput, CalculationResult } from "@/core/rewards/types";
import { MonthlySpendingTracker } from "@/core/rewards/MonthlySpendingTracker";
import { DateTime } from "luxon";

/**
 * Simulation input (similar to Transaction but without payment method)
 */
export interface SimulationInput {
  merchantName: string;
  merchantAddress?: string;
  mcc?: string;
  isOnline: boolean;
  amount: number;
  currency: string;
  convertedAmount?: number;
  convertedCurrency?: string;
  isContactless: boolean;
  date: Date;
}

/**
 * Card calculation result with conversion
 */
export interface CardCalculationResult {
  paymentMethod: PaymentMethod;
  calculation: CalculationResult;
  convertedMiles: number | null;
  conversionRate: number | null;
  rank: number;
  error?: string;
  /** FX rate used for currency conversion (transaction → card currency) */
  fxRate?: number;
  /** Amount after FX conversion to card currency */
  fxConvertedAmount?: number;
  /** Transaction currency */
  transactionCurrency?: string;
  /** Card's base currency */
  cardCurrency?: string;
}

/**
 * SimulatorService orchestrates multi-card reward calculations
 * and currency conversions for the Card Optimizer Simulator feature.
 *
 * Uses the ID-based currency system with reward_currencies table.
 */
export class SimulatorService {
  private rewardService: RewardService;
  private conversionService: ConversionService;
  private monthlySpendingTracker: MonthlySpendingTracker;

  constructor(
    rewardService: RewardService,
    conversionService: ConversionService,
    monthlySpendingTracker: MonthlySpendingTracker
  ) {
    this.rewardService = rewardService;
    this.conversionService = conversionService;
    this.monthlySpendingTracker = monthlySpendingTracker;
  }

  /**
   * Calculate rewards for all active payment methods
   *
   * @param input - Simulation input with transaction details
   * @param paymentMethods - Array of payment methods to simulate
   * @param targetCurrencyId - Target miles currency ID for conversion
   * @returns Array of calculation results, ranked by converted miles
   */
  async simulateAllCards(
    input: SimulationInput,
    paymentMethods: PaymentMethod[],
    targetCurrencyId: string
  ): Promise<CardCalculationResult[]> {
    // Filter to only active payment methods (Requirement 2.1)
    const activePaymentMethods = paymentMethods.filter((pm) => pm.active);

    // Calculate rewards for each card in parallel
    const calculationPromises = activePaymentMethods.map((paymentMethod) =>
      this.simulateSingleCard(input, paymentMethod, targetCurrencyId)
    );

    // Wait for all calculations to complete
    // Using Promise.allSettled to handle individual card failures (Requirement 2.4)
    const results = await Promise.allSettled(calculationPromises);

    // Extract successful results and handle failures
    const cardResults: CardCalculationResult[] = results.map(
      (result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          // Handle individual card failure (Requirement 2.4)
          const paymentMethod = activePaymentMethods[index];
          console.error(
            `Error calculating rewards for ${paymentMethod.name}:`,
            result.reason
          );

          return {
            paymentMethod,
            calculation: {
              totalPoints: 0,
              basePoints: 0,
              bonusPoints: 0,
              pointsCurrency: paymentMethod.pointsCurrency || "points",
              minSpendMet: true,
              messages: ["Calculation failed for this card"],
            },
            convertedMiles: null,
            conversionRate: null,
            rank: 0,
            error: result.reason?.message || "Unknown error",
          };
        }
      }
    );

    // Rank results by converted miles value (Requirement 4.1)
    return this.rankResults(cardResults);
  }

  /**
   * Calculate rewards for a single card
   *
   * @param input - Simulation input with transaction details
   * @param paymentMethod - Payment method to simulate
   * @param targetCurrencyId - Target miles currency ID for conversion
   * @returns Calculation result with conversion
   */
  async simulateSingleCard(
    input: SimulationInput,
    paymentMethod: PaymentMethod,
    targetCurrencyId: string
  ): Promise<CardCalculationResult> {
    console.log(
      `[SimulatorService] START simulateSingleCard for ${paymentMethod.name}, issuer: "${paymentMethod.issuer}", rewardCurrencyId: "${paymentMethod.rewardCurrencyId}"`
    );
    try {
      // Get monthly spending for this payment method (Requirement 7.1)
      const monthlySpend = await this.getMonthlySpending(
        paymentMethod.id,
        input.date
      );

      // Get rewardCurrencyId from payment method or look up from issuer
      let rewardCurrencyId = paymentMethod.rewardCurrencyId;
      if (!rewardCurrencyId) {
        // Try to look up reward currency by issuer
        const rewardCurrency =
          await this.conversionService.getRewardCurrencyByIssuer(
            paymentMethod.issuer
          );
        if (rewardCurrency) {
          rewardCurrencyId = rewardCurrency.id;
          console.log(
            `[SimulatorService] Looked up rewardCurrencyId from issuer "${paymentMethod.issuer}": "${rewardCurrencyId}"`
          );
        }
      }

      // Determine card's base currency
      const cardCurrency = paymentMethod.currency || "CAD";
      const transactionCurrency = input.currency;

      // Auto-fetch FX rate if transaction currency differs from card currency
      let fxRate: number | undefined;
      let fxConvertedAmount: number | undefined;
      let convertedAmount = input.convertedAmount;
      let convertedCurrency = input.convertedCurrency || cardCurrency;

      if (transactionCurrency !== cardCurrency) {
        try {
          const exchangeRateService = ExchangeRateService.getInstance();
          fxRate = await exchangeRateService.getRate(
            transactionCurrency as Currency,
            cardCurrency as Currency
          );
          fxConvertedAmount = input.amount * fxRate;
          convertedAmount = fxConvertedAmount;
          convertedCurrency = cardCurrency;
          console.log(
            `[SimulatorService] FX conversion: ${input.amount} ${transactionCurrency} → ${fxConvertedAmount.toFixed(2)} ${cardCurrency} (rate: ${fxRate.toFixed(4)})`
          );
        } catch (error) {
          console.warn(
            `[SimulatorService] Failed to fetch FX rate for ${transactionCurrency} → ${cardCurrency}:`,
            error
          );
        }
      }

      // Build calculation input
      console.log(
        `[SimulatorService] Payment method: ${paymentMethod.name}, rewardCurrencyId: "${rewardCurrencyId}", cardCatalogId: "${paymentMethod.cardCatalogId}"`
      );
      const calculationInput: CalculationInput = {
        amount: input.amount,
        currency: input.currency,
        convertedAmount,
        convertedCurrency,
        paymentMethod: {
          id: paymentMethod.id,
          issuer: paymentMethod.issuer,
          name: paymentMethod.name,
          pointsCurrency: paymentMethod.pointsCurrency,
          cardCatalogId: paymentMethod.cardCatalogId,
        },
        mcc: input.mcc,
        merchantName: input.merchantName,
        transactionType: "purchase",
        isOnline: input.isOnline,
        isContactless: input.isContactless,
        date: DateTime.fromJSDate(input.date),
        monthlySpend,
      };

      // Calculate rewards using existing RewardService (Requirement 2.2)
      const calculation =
        await this.rewardService.calculateRewards(calculationInput);

      // Convert to miles currency using ID-based method (Requirement 3.2)
      let convertedMiles: number | null = null;
      let conversionRate: number | null = null;

      if (rewardCurrencyId && targetCurrencyId) {
        const conversionResult =
          await this.conversionService.convertToMilesById(
            calculation.totalPoints,
            rewardCurrencyId,
            targetCurrencyId
          );
        convertedMiles = conversionResult.miles;
        conversionRate = conversionResult.rate;
      } else {
        console.warn(
          `[SimulatorService] Cannot convert - missing rewardCurrencyId: "${rewardCurrencyId}" or targetCurrencyId: "${targetCurrencyId}"`
        );
      }

      return {
        paymentMethod,
        calculation,
        convertedMiles,
        conversionRate,
        rank: 0, // Will be set by rankResults
        fxRate,
        fxConvertedAmount,
        transactionCurrency,
        cardCurrency,
      };
    } catch (error) {
      // Handle individual card calculation error
      console.error(`Error simulating card ${paymentMethod.name}:`, error);
      throw error;
    }
  }

  /**
   * Alias for simulateAllCards (for backward compatibility)
   * @deprecated Use simulateAllCards instead
   */
  async simulateAllCardsById(
    input: SimulationInput,
    paymentMethods: PaymentMethod[],
    targetCurrencyId: string
  ): Promise<CardCalculationResult[]> {
    return this.simulateAllCards(input, paymentMethods, targetCurrencyId);
  }

  /**
   * Alias for simulateSingleCard (for backward compatibility)
   * @deprecated Use simulateSingleCard instead
   */
  async simulateSingleCardById(
    input: SimulationInput,
    paymentMethod: PaymentMethod,
    targetCurrencyId: string
  ): Promise<CardCalculationResult> {
    return this.simulateSingleCard(input, paymentMethod, targetCurrencyId);
  }

  /**
   * Rank results by converted miles value
   * Cards with null conversions are placed at the end (Requirement 4.3)
   *
   * @param results - Array of calculation results
   * @returns Sorted array with rank assigned
   */
  rankResults(results: CardCalculationResult[]): CardCalculationResult[] {
    // Separate results with and without conversions
    const withConversion = results.filter((r) => r.convertedMiles !== null);
    const withoutConversion = results.filter((r) => r.convertedMiles === null);

    // Sort results with conversion by miles (descending)
    // If miles are equal, maintain alphabetical order by card name (Requirement 4.2)
    withConversion.sort((a, b) => {
      const milesA = a.convertedMiles || 0;
      const milesB = b.convertedMiles || 0;

      if (milesA !== milesB) {
        return milesB - milesA; // Higher miles first
      }

      // If miles are equal, sort alphabetically by card name
      return a.paymentMethod.name.localeCompare(b.paymentMethod.name);
    });

    // Sort results without conversion alphabetically
    withoutConversion.sort((a, b) =>
      a.paymentMethod.name.localeCompare(b.paymentMethod.name)
    );

    // Combine results: converted first, then non-converted
    const rankedResults = [...withConversion, ...withoutConversion];

    // Assign ranks
    rankedResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    return rankedResults;
  }

  /**
   * Get monthly spending for a payment method
   * Returns 0 if retrieval fails (Requirement 7.4)
   *
   * @param paymentMethodId - Payment method ID
   * @param date - Date to calculate spending for
   * @returns Monthly spending amount
   */
  async getMonthlySpending(
    paymentMethodId: string,
    date: Date
  ): Promise<number> {
    try {
      // Use calendar month by default
      // In a real implementation, this could be configurable per payment method
      const spending = await this.monthlySpendingTracker.getMonthlySpending(
        paymentMethodId,
        "calendar_month",
        date,
        1 // Default statement day
      );

      return spending;
    } catch (error) {
      console.error(
        `Error getting monthly spending for ${paymentMethodId}:`,
        error
      );
      // Return 0 if retrieval fails (Requirement 7.4)
      return 0;
    }
  }
}
