
import React from 'react';
import { PaymentMethod } from '@/types';
import { CreditCardIcon, BanknoteIcon } from 'lucide-react';

interface PaymentCardDisplayProps {
  paymentMethod: PaymentMethod;
  customImage?: string; // Add optional prop for custom image URL
}

const PaymentCardDisplay: React.FC<PaymentCardDisplayProps> = ({ paymentMethod, customImage }) => {
  // If there's a custom image, render that instead of the default card display
  if (customImage) {
    return (
      <div className="relative rounded-lg overflow-hidden w-48 h-28">
        <img 
          src={customImage} 
          alt={`${paymentMethod.name} card`} 
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
    );
  }
  
  // Render a simplified card display with the payment method information
  return (
    <div
      className="relative rounded-lg overflow-hidden w-48 h-28 p-3 flex flex-col justify-between"
      style={{ backgroundColor: paymentMethod.color || '#4b5563' }}
    >
      <div className="flex justify-between items-start">
        <div className="text-white text-xs font-semibold line-clamp-2">
          {paymentMethod.name}
        </div>
        {paymentMethod.type === 'credit_card' ? (
          <CreditCardIcon className="h-4 w-4 text-white opacity-80" />
        ) : (
          <BanknoteIcon className="h-4 w-4 text-white opacity-80" />
        )}
      </div>
      
      <div className="text-white">
        {paymentMethod.type === 'credit_card' && paymentMethod.lastFourDigits && (
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <div className="w-6 h-4 bg-white/20 rounded" />
              <div className="w-6 h-4 bg-white/20 rounded" />
              <div className="w-6 h-4 bg-white/20 rounded" />
            </div>
            <div className="text-xs font-mono tracking-wider">{paymentMethod.lastFourDigits}</div>
          </div>
        )}
        {paymentMethod.issuer && (
          <div className="text-[10px] text-white/70 mt-1 font-semibold uppercase">
            {paymentMethod.issuer}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCardDisplay;
