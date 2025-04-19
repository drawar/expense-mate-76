import { useState, useEffect } from "react";
import { Transaction, PaymentMethod } from "@/types";
import {
  cardOptimizationUtils,
  CardOptimizationRecommendation,
} from "@/utils/dashboard/cardOptimizationUtils";

/**
 * Hook for card optimization recommendations based on transaction history
 */
export function useCardOptimization(
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
) {
  const [recommendations, setRecommendations] =
    useState<CardOptimizationRecommendation>({
      topCategories: [],
      underutilizedMethods: [],
      potentialSavings: 0,
      bestMethodsByCategory: {},
    });

  const [optimalCard, setOptimalCard] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (transactions.length && paymentMethods.length) {
      setIsLoading(true);

      // Use setTimeout to avoid blocking the main thread for large datasets
      setTimeout(() => {
        try {
          // Generate recommendations using our refactored utility
          const results = cardOptimizationUtils.analyzeSpending(
            transactions,
            paymentMethods,
            { topCategoriesLimit: 5 }
          );

          setRecommendations(results);

          // Find the best overall card by identifying which one appears most frequently in category recommendations
          const cardFrequency = new Map<string, number>();

          Object.values(results.bestMethodsByCategory).forEach((methods) => {
            if (methods.length > 0) {
              const bestMethod = methods[0];
              cardFrequency.set(
                bestMethod.id,
                (cardFrequency.get(bestMethod.id) || 0) + 1
              );
            }
          });

          // Find the card with the highest frequency
          let bestCardId = "";
          let highestFrequency = 0;

          cardFrequency.forEach((frequency, id) => {
            if (frequency > highestFrequency) {
              highestFrequency = frequency;
              bestCardId = id;
            }
          });

          // Set the optimal card
          const bestOverallCard = paymentMethods.find(
            (method) => method.id === bestCardId
          );
          setOptimalCard(bestOverallCard || null);
        } catch (error) {
          console.error("Error analyzing card optimization:", error);
        } finally {
          setIsLoading(false);
        }
      }, 0);
    }
  }, [transactions, paymentMethods]);

  return {
    optimalCard,
    potentialSavings: recommendations.potentialSavings,
    topCategories: recommendations.topCategories,
    underutilizedMethods: recommendations.underutilizedMethods,
    bestMethodsByCategory: recommendations.bestMethodsByCategory,
    isLoading,
  };
}
