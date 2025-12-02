
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon } from 'lucide-react';

interface EmptyPaymentMethodsCardProps {
  type: 'credit_cards' | 'cash';
  onAddClick: () => void;
}

const EmptyPaymentMethodsCard: React.FC<EmptyPaymentMethodsCardProps> = ({ type, onAddClick }) => {
  return (
    <div className="glass-card rounded-xl p-8 text-center">
      <p className="text-muted-foreground mb-4">
        {type === 'credit_cards' 
          ? 'No credit cards added yet.' 
          : 'No cash payment methods added yet.'
        }
      </p>
      <Button onClick={onAddClick}>
        <PlusCircleIcon 
          className="mr-2 h-4 w-4" 
          style={{ strokeWidth: 2.5 }}
        />
        Add {type === 'credit_cards' ? 'Credit Card' : 'Cash Method'}
      </Button>
    </div>
  );
};

export default EmptyPaymentMethodsCard;
