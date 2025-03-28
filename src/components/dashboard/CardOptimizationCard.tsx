import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCardIcon, CoinsIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { Transaction, PaymentMethod } from '@/types';
import { calculateOptimalCard } from '@/utils/cardOptimization';
import { formatCurrency } from '@/utils/currencyFormatter';

interface CardOptimizationCardProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
}

// Helper function to find the best card for the most common category
const findBestCardForCategory = (transactions: Transaction[], paymentMethods: PaymentMethod[]) => {
  // Extract the most common category
  const categoryCounts = transactions.reduce((acc, tx) => {
    const category = tx.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Find the category with the highest count
  const entries = Object.entries(categoryCounts);
  if (entries.length === 0) return null;
  
  entries.sort((a, b) => b[1] - a[1]);
  const [topCategory] = entries[0];
  
  // Basic simulation of reward points for each card for this category
  // In a real implementation, this would use your reward rules logic
  const cardScores = paymentMethods
    .filter(method => method.type === 'credit_card')
    .map(card => {
      // Use the number of reward rules as a proxy for card value
      // In a real implementation, you'd calculate expected points based on rules
      const ruleCount = card.rewardRules?.length || 0;
      return {
        card,
        score: ruleCount
      };
    })
    .sort((a, b) => b.score - a.score);
  
  if (cardScores.length === 0) return null;
  
  return {
    category: topCategory,
    card: cardScores[0].card
  };
};

const CardOptimizationCard: React.FC<CardOptimizationCardProps> = ({ transactions, paymentMethods }) => {
  // Calculate optimization metrics
  const optimizationMetrics = useMemo(() => {
    if (!transactions.length) return null;
    
    // Calculate potential points if optimal cards were used
    let potentialPoints = 0;
    let actualPoints = 0;
    let missedPoints = 0;
    let suboptimalTransactions = 0;
    
    transactions.forEach(tx => {
      const optimalCard = calculateOptimalCard(tx, paymentMethods);
      actualPoints += tx.rewardPoints || 0;
      
      if (optimalCard && (optimalCard.id !== tx.paymentMethod.id)) {
        // Simplified calculation - in real implementation use your reward rules logic
        // Here we're assuming optimized is ~30% better as a placeholder
        const estimatedOptimalPoints = (tx.rewardPoints || 0) * 1.3;
        potentialPoints += estimatedOptimalPoints;
        missedPoints += estimatedOptimalPoints - (tx.rewardPoints || 0);
        suboptimalTransactions++;
      } else {
        potentialPoints += tx.rewardPoints || 0;
      }
    });
    
    // Calculate optimization score (0-100)
    const optimizationScore = potentialPoints > 0 
      ? Math.round((actualPoints / potentialPoints) * 100) 
      : 100;
    
    return {
      optimizationScore,
      missedPoints: Math.round(missedPoints),
      suboptimalTransactions,
      bestRecommendation: findBestCardForCategory(transactions, paymentMethods)
    };
  }, [transactions, paymentMethods]);
  
  return (
    <Card className="rounded-xl border border-border/50 bg-card hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5 text-primary" />
          Card Optimization
        </CardTitle>
      </CardHeader>
      <CardContent>
        {optimizationMetrics ? (
          <div className="space-y-4">
            {/* Optimization Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rewards Optimization Score</span>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      optimizationMetrics.optimizationScore > 80 
                        ? 'bg-green-500' 
                        : optimizationMetrics.optimizationScore > 60 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${optimizationMetrics.optimizationScore}%` }}
                  ></div>
                </div>
                <span className="ml-2 font-medium">{optimizationMetrics.optimizationScore}%</span>
              </div>
            </div>
            
            {/* Missed Points */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Missed Reward Points</span>
              <span className="font-medium flex items-center">
                <CoinsIcon className="h-4 w-4 mr-1 text-amber-500" />
                {optimizationMetrics.missedPoints.toLocaleString()}
              </span>
            </div>
            
            {/* Suboptimal Transactions */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Suboptimal Card Choices</span>
              <span className="font-medium">{optimizationMetrics.suboptimalTransactions} transactions</span>
            </div>
            
            {/* Next Purchase Recommendation */}
            <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <h4 className="text-sm font-semibold mb-2">Best Card for Next Purchase</h4>
              {optimizationMetrics.bestRecommendation ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-6 rounded flex items-center justify-center bg-primary/20 text-primary">
                    <CreditCardIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{optimizationMetrics.bestRecommendation.card.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Best for {optimizationMetrics.bestRecommendation.category} purchases
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Add more transactions to get recommendations</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>Not enough data for optimization insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CardOptimizationCard;
