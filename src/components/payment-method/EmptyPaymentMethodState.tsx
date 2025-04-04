
import React from 'react';
import { CreditCardIcon, PlusCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyPaymentMethodStateProps {
  onAddClick: () => void;
}

export const EmptyPaymentMethodState: React.FC<EmptyPaymentMethodStateProps> = ({ onAddClick }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-lg bg-muted/20">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <CreditCardIcon className="h-10 w-10 text-primary/70" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Payment Methods</h3>
      <p className="text-center text-muted-foreground mb-6 max-w-md">
        Add credit cards or cash payment methods to track your expenses and optimize reward points.
      </p>
      <Button onClick={onAddClick} className="gap-2">
        <PlusCircleIcon className="h-4 w-4" />
        Add Your First Payment Method
      </Button>
    </div>
  );
};
