
import React from 'react';
import { PaymentMethod } from '@/types';
import { ToggleLeftIcon, ToggleRightIcon, EditIcon, ImageIcon } from 'lucide-react';
import { CreditCardIcon, BanknoteIcon, CalendarIcon, CoinsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import PaymentCardDisplay from '../expense/PaymentCardDisplay';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onToggleActive: (id: string) => void;
  onEdit: (method: PaymentMethod) => void;
  onImageUpload: (method: PaymentMethod) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ 
  method, 
  onToggleActive, 
  onEdit,
  onImageUpload
}) => {
  const icon = method.type === 'credit_card' ? 
    <CreditCardIcon className="h-5 w-5" style={{ color: method.color }} /> : 
    <BanknoteIcon className="h-5 w-5" style={{ color: method.color }} />;

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      !method.active && "opacity-70"
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full" style={{ backgroundColor: `${method.color}20` }}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{method.name}</CardTitle>
              <CardDescription>
                {method.type === 'credit_card' 
                  ? `${method.issuer} ${method.lastFourDigits ? `•••• ${method.lastFourDigits}` : ''}`
                  : `${method.currency}`
                }
              </CardDescription>
            </div>
          </div>
          <div className="flex">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onToggleActive(method.id)}
              title={method.active ? "Deactivate" : "Activate"}
            >
              {method.active ? (
                <ToggleRightIcon className="h-5 w-5 text-green-500" />
              ) : (
                <ToggleLeftIcon className="h-5 w-5 text-gray-400" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(method)}
              title="Edit"
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            {method.type === 'credit_card' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onImageUpload(method)}
                title="Upload Card Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {method.type === 'credit_card' && (
          <>
            {method.imageUrl && (
              <div className="mb-3 max-w-[180px]">
                <PaymentCardDisplay 
                  paymentMethod={method} 
                  customImage={method.imageUrl} 
                />
              </div>
            )}
            <div className="flex items-center text-sm">
              <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
              <span>
                {method.statementStartDay 
                  ? `Statement Cycle: Day ${method.statementStartDay}` 
                  : 'Calendar Month'}
              </span>
            </div>
            
            <div className="flex items-center text-sm mt-1">
              <CoinsIcon className="h-4 w-4 mr-2 text-amber-500" />
              <span>
                {method.rewardRules.length 
                  ? `${method.rewardRules.length} Reward Rules` 
                  : 'No rewards configured'}
              </span>
            </div>
            
            {method.rewardRules.length > 0 && (
              <div className="mt-3 space-y-2">
                {method.rewardRules.slice(0, 2).map((rule) => (
                  <div 
                    key={rule.id} 
                    className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 inline-block mr-2"
                  >
                    {rule.description}
                  </div>
                ))}
                {method.rewardRules.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{method.rewardRules.length - 2} more
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodCard;
