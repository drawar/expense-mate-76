
import React from 'react';
import { PaymentMethod } from '@/types';
import { CreditCardIcon, BanknoteIcon } from 'lucide-react';
import { SelectItem } from '@/components/ui/select';

interface PaymentCardRenderProps {
  paymentMethods: PaymentMethod[];
}

const PaymentCardRender: React.FC<PaymentCardRenderProps> = ({ paymentMethods }) => {
  return (
    <>
      {paymentMethods.map((method) => (
        <SelectItem key={method.id} value={method.id}>
          <div className="flex items-center gap-2">
            {method.type === 'credit_card' ? (
              <CreditCardIcon className="h-4 w-4" style={{ color: method.color }} />
            ) : (
              <BanknoteIcon className="h-4 w-4" style={{ color: method.color }} />
            )}
            <span>{method.name}</span>
            {method.type === 'credit_card' && method.lastFourDigits && (
              <span className="text-gray-500 text-xs">...{method.lastFourDigits}</span>
            )}
          </div>
        </SelectItem>
      ))}
    </>
  );
};

export default PaymentCardRender;
