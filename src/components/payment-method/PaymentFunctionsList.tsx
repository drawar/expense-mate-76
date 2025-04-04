
import React, { useState } from 'react';
import { PaymentMethod } from '@/types';
import { 
  ToggleLeftIcon, 
  ToggleRightIcon, 
  EditIcon, 
  ImageIcon, 
  ShieldIcon, 
  CreditCardIcon,
  BanknoteIcon,
  CalendarIcon,
  CoinsIcon,
  ChevronRightIcon
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import RewardRulesAdmin from './RewardRulesAdmin';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Button } from '@/components/ui/button';
import { useTransactionFiltering } from '@/hooks/dashboard/useTransactionFiltering';
import { useTransactionsQuery } from '@/hooks/queries/useTransactionsQuery';
import { Separator } from '@/components/ui/separator';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

interface PaymentFunctionsListProps {
  paymentMethod: PaymentMethod;
  onToggleActive: (id: string) => void;
  onEdit: (method: PaymentMethod) => void;
  onImageUpload: (method: PaymentMethod) => void;
}

export const PaymentFunctionsList: React.FC<PaymentFunctionsListProps> = ({
  paymentMethod,
  onToggleActive,
  onEdit,
  onImageUpload
}) => {
  const [isRulesDialogOpen, setIsRulesDialogOpen] = useState(false);
  const { data: allTransactions = [] } = useTransactionsQuery();
  const { filterTransactions } = useTransactionFiltering();
  
  // Filter transactions for this payment method
  const paymentMethodTransactions = filterTransactions(allTransactions, {
    paymentMethodIds: [paymentMethod.id]
  });

  // Calculate total spent with this payment method
  const totalSpent = paymentMethodTransactions.reduce((total, tx) => total + tx.paymentAmount, 0);
  
  // Calculate total reward points earned
  const totalRewardPoints = paymentMethodTransactions.reduce((total, tx) => total + (tx.rewardPoints || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <h2 className="text-xl font-semibold flex items-center">
          {paymentMethod.type === 'credit_card' ? (
            <CreditCardIcon className="h-5 w-5 mr-2 text-primary/70" />
          ) : (
            <BanknoteIcon className="h-5 w-5 mr-2 text-primary/70" />
          )}
          {paymentMethod.type === 'credit_card' 
            ? `${paymentMethod.issuer} ${paymentMethod.name}` 
            : paymentMethod.name
          }
        </h2>
        
        <Button 
          variant={paymentMethod.active ? "default" : "outline"} 
          size="sm"
          className="mt-2 sm:mt-0"
          onClick={() => onToggleActive(paymentMethod.id)}
        >
          {paymentMethod.active ? (
            <ToggleRightIcon className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <ToggleLeftIcon className="h-4 w-4 mr-2" />
          )}
          {paymentMethod.active ? "Active" : "Inactive"}
        </Button>
      </div>
      
      <Separator />

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted/40 rounded-lg p-4">
          <h3 className="text-sm text-muted-foreground mb-1">Total Spent</h3>
          <p className="text-xl font-semibold">{formatCurrency(totalSpent, paymentMethod.currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">{paymentMethodTransactions.length} transactions</p>
        </div>
        
        {paymentMethod.type === 'credit_card' && (
          <div className="bg-muted/40 rounded-lg p-4">
            <h3 className="text-sm text-muted-foreground mb-1">Reward Points</h3>
            <p className="text-xl font-semibold">{totalRewardPoints.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Total earned points</p>
          </div>
        )}
        
        <div className="bg-muted/40 rounded-lg p-4">
          <h3 className="text-sm text-muted-foreground mb-1">Statement Cycle</h3>
          <p className="text-xl font-semibold">
            {paymentMethod.type === 'credit_card' && paymentMethod.statementStartDay 
              ? `Day ${paymentMethod.statementStartDay}` 
              : 'Calendar Month'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Billing cycle</p>
        </div>
      </div>

      {/* Functions list */}
      <div className="bg-card rounded-lg shadow-sm border">
        <div className="divide-y">
          {/* Edit payment method */}
          <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer" 
               onClick={() => onEdit(paymentMethod)}>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <EditIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Edit Payment Method</h3>
                  <p className="text-sm text-muted-foreground">Update name, currency, and other details</p>
                </div>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {/* Upload card image - only for credit cards */}
          {paymentMethod.type === 'credit_card' && (
            <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                 onClick={() => onImageUpload(paymentMethod)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ImageIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Upload Card Image</h3>
                    <p className="text-sm text-muted-foreground">
                      {paymentMethod.imageUrl ? "Change card image" : "Add an image of your card"}
                    </p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          )}
          
          {/* Statement details */}
          {paymentMethod.type === 'credit_card' && (
            <div className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Statement Details</h3>
                    <p className="text-sm text-muted-foreground">
                      {paymentMethod.statementStartDay 
                        ? `Statement starts on day ${paymentMethod.statementStartDay} of each month` 
                        : 'Calendar month billing cycle'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Manage reward rules - only for credit cards */}
          {paymentMethod.type === 'credit_card' && (
            <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                 onClick={() => setIsRulesDialogOpen(true)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ShieldIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Manage Reward Rules</h3>
                    <p className="text-sm text-muted-foreground">
                      {paymentMethod.rewardRules && paymentMethod.rewardRules.length > 0
                        ? `${paymentMethod.rewardRules.length} rules configured` 
                        : 'No reward rules configured'}
                    </p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Reward rules section */}
      {paymentMethod.type === 'credit_card' && paymentMethod.rewardRules && paymentMethod.rewardRules.length > 0 && (
        <Accordion type="single" collapsible className="bg-card rounded-lg shadow-sm border">
          <AccordionItem value="reward-rules">
            <AccordionTrigger className="px-4 py-3">
              <div className="flex items-center">
                <CoinsIcon className="h-4 w-4 mr-2 text-amber-500" />
                <span className="font-medium">Reward Rules</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                {paymentMethod.rewardRules.map((rule) => (
                  <div key={rule.id} className="bg-muted/50 p-3 rounded-md">
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                        {rule.pointsMultiplier}x Points
                      </span>
                      <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                        {typeof rule.condition === 'string' ? rule.condition : rule.type}
                      </span>
                      {rule.maxSpend && (
                        <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                          Cap: {formatCurrency(rule.maxSpend, paymentMethod.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      
      {/* Rules Dialog */}
      <Dialog open={isRulesDialogOpen} onOpenChange={setIsRulesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Reward Rules for {paymentMethod.issuer} {paymentMethod.name}
            </DialogTitle>
          </DialogHeader>
          
          <RewardRulesAdmin paymentMethod={paymentMethod} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
