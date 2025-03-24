
import React from 'react';
import { PaymentMethod } from '@/types';
import { CreditCardIcon, BanknoteIcon } from 'lucide-react';

interface PaymentCardDisplayProps {
  paymentMethod: PaymentMethod;
  customImage?: string;
  size?: 'default' | 'small';
}

const PaymentCardDisplay: React.FC<PaymentCardDisplayProps> = ({ 
  paymentMethod, 
  customImage,
  size = 'default' 
}) => {
  // Determine classes based on size
  const containerClasses = size === 'small' 
    ? "relative rounded-lg overflow-hidden w-24 h-14" 
    : "relative rounded-lg overflow-hidden w-48 h-28";
  
  const textClasses = size === 'small' ? "text-[8px]" : "text-xs";
  const iconClasses = size === 'small' ? "h-3 w-3" : "h-4 w-4";
  const lastFourClasses = size === 'small' ? "text-[8px]" : "text-xs";
  const issuerClasses = size === 'small' ? "text-[6px]" : "text-[10px]";
  const dotClasses = size === 'small' ? "w-3 h-2" : "w-6 h-4";
  
  // If there's a custom image, render that instead of the default card display
  if (customImage) {
    return (
      <div className={containerClasses}>
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
      className={`${containerClasses} p-3 flex flex-col justify-between`}
      style={{ backgroundColor: paymentMethod.color || '#4b5563' }}
    >
      <div className="flex justify-between items-start">
        <div className={`text-white ${textClasses} font-semibold line-clamp-2`}>
          {paymentMethod.name}
        </div>
        {paymentMethod.type === 'credit_card' ? (
          <CreditCardIcon className={`${iconClasses} text-white opacity-80`} />
        ) : (
          <BanknoteIcon className={`${iconClasses} text-white opacity-80`} />
        )}
      </div>
      
      <div className="text-white">
        {paymentMethod.type === 'credit_card' && paymentMethod.lastFourDigits && (
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <div className={`${dotClasses} bg-white/20 rounded`} />
              <div className={`${dotClasses} bg-white/20 rounded`} />
              <div className={`${dotClasses} bg-white/20 rounded`} />
            </div>
            <div className={`${lastFourClasses} font-mono tracking-wider`}>{paymentMethod.lastFourDigits}</div>
          </div>
        )}
        {paymentMethod.issuer && (
          <div className={`${issuerClasses} text-white/70 mt-1 font-semibold uppercase`}>
            {paymentMethod.issuer}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCardDisplay;
