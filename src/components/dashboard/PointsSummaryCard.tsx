
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CoinsIcon, CreditCardIcon } from 'lucide-react';
import { Transaction, PaymentMethod } from '@/types';
import { getTransactions, getPaymentMethods } from '@/utils/storageUtils';
import { CardRegistry } from '../expense/cards/CardRegistry';

interface PointsByCard {
  [cardId: string]: {
    cardName: string;
    issuer: string;
    pointsCurrency: string;
    totalPoints: number;
    cardImageUrl?: string;
  };
}

interface PointsByCurrency {
  [currency: string]: {
    totalPoints: number;
    cards: string[];
  };
}

const PointsSummaryCard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [pointsByCard, setPointsByCard] = useState<PointsByCard>({});
  const [pointsByCurrency, setPointsByCurrency] = useState<PointsByCurrency>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [txs, methods] = await Promise.all([
          getTransactions(),
          getPaymentMethods()
        ]);
        
        setTransactions(txs.filter(tx => !tx.is_deleted));
        setPaymentMethods(methods);
        
        // Process data after loading
        calculatePointsAggregation(txs.filter(tx => !tx.is_deleted), methods);
      } catch (error) {
        console.error('Error loading data for points summary:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const calculatePointsAggregation = (txs: Transaction[], methods: PaymentMethod[]) => {
    const byCard: PointsByCard = {};
    const byCurrency: PointsByCurrency = {};
    
    // First, calculate points by card
    txs.forEach(tx => {
      if (tx.rewardPoints <= 0) return;
      
      const method = methods.find(m => m.id === tx.paymentMethod.id);
      if (!method) return;
      
      const cardKey = `${method.issuer}-${method.name}`;
      const cardEntry = byCard[cardKey] || {
        cardName: method.name,
        issuer: method.issuer || '',
        pointsCurrency: 'Points', // Default value
        totalPoints: 0,
        cardImageUrl: method.imageUrl
      };
      
      // Find card in registry to get points currency
      const cardInfo = CardRegistry.findCard(method.issuer || '', method.name);
      if (cardInfo) {
        cardEntry.pointsCurrency = cardInfo.pointsCurrency;
      }
      
      cardEntry.totalPoints += tx.rewardPoints;
      byCard[cardKey] = cardEntry;
    });
    
    // Then, calculate points by currency
    Object.entries(byCard).forEach(([cardKey, cardData]) => {
      const currencyKey = cardData.pointsCurrency;
      
      if (!byCurrency[currencyKey]) {
        byCurrency[currencyKey] = {
          totalPoints: 0,
          cards: []
        };
      }
      
      byCurrency[currencyKey].totalPoints += cardData.totalPoints;
      byCurrency[currencyKey].cards.push(cardKey);
    });
    
    setPointsByCard(byCard);
    setPointsByCurrency(byCurrency);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CoinsIcon className="h-5 w-5" />
            Points Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading rewards data...</div>
        </CardContent>
      </Card>
    );
  }
  
  if (Object.keys(pointsByCard).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CoinsIcon className="h-5 w-5" />
            Points Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            No rewards points earned yet. Start using your cards to earn points!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CoinsIcon className="h-5 w-5" />
          Points Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="by-card">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="by-card" className="flex-1">By Card</TabsTrigger>
            <TabsTrigger value="by-currency" className="flex-1">By Currency</TabsTrigger>
          </TabsList>
          
          <TabsContent value="by-card" className="space-y-4">
            {Object.entries(pointsByCard).map(([cardKey, data]) => (
              <div key={cardKey} className="flex items-start justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  {data.cardImageUrl ? (
                    <img 
                      src={data.cardImageUrl} 
                      alt={`${data.issuer} ${data.cardName}`} 
                      className="w-10 h-6 object-contain"
                    />
                  ) : (
                    <CreditCardIcon className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <div className="font-medium">{data.issuer} {data.cardName}</div>
                    <div className="text-xs text-gray-500">{data.pointsCurrency}</div>
                  </div>
                </div>
                <div className="font-bold">{data.totalPoints.toLocaleString()}</div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="by-currency" className="space-y-4">
            {Object.entries(pointsByCurrency).map(([currency, data]) => (
              <div key={currency} className="flex items-start justify-between border-b pb-2">
                <div>
                  <div className="font-medium">{currency}</div>
                  <div className="text-xs text-gray-500">
                    {data.cards.length} card{data.cards.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="font-bold">{data.totalPoints.toLocaleString()}</div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PointsSummaryCard;
