
import React from 'react';
import { PaymentMethod } from '@/types';
import { SelectItem } from '@/components/ui/select';
import { BanknoteIcon, CreditCardIcon } from 'lucide-react';

// Currency flag components as SVGs
const CurrencyFlag = ({ currency }: { currency: string }) => {
  switch (currency) {
    case 'USD':
      return (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#F0F0F0" />
          <rect y="0" width="24" height="1.85" fill="#D80027" />
          <rect y="3.7" width="24" height="1.85" fill="#D80027" />
          <rect y="7.4" width="24" height="1.85" fill="#D80027" />
          <rect y="11.1" width="24" height="1.85" fill="#D80027" />
          <rect y="14.8" width="24" height="1.85" fill="#D80027" />
          <rect y="18.5" width="24" height="1.85" fill="#D80027" />
          <rect y="22.15" width="24" height="1.85" fill="#D80027" />
          <rect width="12" height="12.9" fill="#2E52B2" />
        </svg>
      );
    case 'SGD':
      return (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#F0F0F0" />
          <rect width="24" height="12" fill="#D80027" />
          <path d="M6 6 A 2 2 0 1 0 6 10 A 2 2 0 1 0 6 6" fill="#F0F0F0" />
          <path d="M8 8 L 9 8.5 L 8.5 9.5 L 7.5 9 L 7 10 L 6 9.5 L 5.5 10.5 L 5 9.5 L 4 10 L 3.5 9 L 2.5 9.5 L 2 8.5 L 3 8" fill="#F0F0F0" />
        </svg>
      );
    case 'JPY':
      return (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#F0F0F0" />
          <circle cx="12" cy="12" r="4" fill="#D80027" />
        </svg>
      );
    case 'INR':
      return (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="8" fill="#FF9933" />
          <rect y="8" width="24" height="8" fill="#F0F0F0" />
          <rect y="16" width="24" height="8" fill="#138808" />
          <circle cx="12" cy="12" r="2" fill="#000080" />
        </svg>
      );
    case 'CAD':
      return (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#F0F0F0" />
          <rect width="6" height="24" fill="#D80027" />
          <rect x="18" width="6" height="24" fill="#D80027" />
          <path d="M14 10 L 12 8 L 10 10 L 11 12 L 9 14 L 12 14 L 12 16 L 15 14 L 13 12 Z" fill="#D80027" />
        </svg>
      );
    case 'EUR':
      return (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#0052B4" />
          <path d="M12 6 L 12.5 7 L 13.5 7 L 12.75 8 L 13 9 L 12 8.5 L 11 9 L 11.25 8 L 10.5 7 L 11.5 7 Z" fill="#FFDA44" />
          <path d="M12 10 L 12.5 11 L 13.5 11 L 12.75 12 L 13 13 L 12 12.5 L 11 13 L 11.25 12 L 10.5 11 L 11.5 11 Z" fill="#FFDA44" />
          <path d="M12 14 L 12.5 15 L 13.5 15 L 12.75 16 L 13 17 L 12 16.5 L 11 17 L 11.25 16 L 10.5 15 L 11.5 15 Z" fill="#FFDA44" />
          <path d="M8 8 L 8.5 9 L 9.5 9 L 8.75 10 L 9 11 L 8 10.5 L 7 11 L 7.25 10 L 6.5 9 L 7.5 9 Z" fill="#FFDA44" />
          <path d="M16 8 L 16.5 9 L 17.5 9 L 16.75 10 L 17 11 L 16 10.5 L 15 11 L 15.25 10 L 14.5 9 L 15.5 9 Z" fill="#FFDA44" />
          <path d="M8 16 L 8.5 17 L 9.5 17 L 8.75 18 L 9 19 L 8 18.5 L 7 19 L 7.25 18 L 6.5 17 L 7.5 17 Z" fill="#FFDA44" />
          <path d="M16 16 L 16.5 17 L 17.5 17 L 16.75 18 L 17 19 L 16 18.5 L 15 19 L 15.25 18 L 14.5 17 L 15.5 17 Z" fill="#FFDA44" />
        </svg>
      );
    case 'GBP':
      return (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#0052B4" />
          <path d="M24 0 H 0 V 24 H 24 V 0 Z" fill="#0052B4" />
          <path d="M13.5 0 V 10.5 H 24 V 13.5 H 13.5 V 24 H 10.5 V 13.5 H 0 V 10.5 H 10.5 V 0 H 13.5 Z" fill="#F0F0F0" />
          <path d="M16.25 8 L 24 2 V 0 H 21.75 L 12 7 H 9 L 0 0 V 2 L 7.75 8 H 0 V 16 H 7.75 L 0 22 V 24 H 2.25 L 12 17 H 15 L 24 24 V 22 L 16.25 16 H 24 V 8 H 16.25 Z" fill="#D80027" />
        </svg>
      );
    case 'AUD':
      return (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#0052B4" />
          <rect width="12" height="12" fill="#F0F0F0" />
          <path d="M0 0 L 12 6 L 0 12 Z" fill="#F0F0F0" />
          <path d="M6 0 V 12 H 0 V 0 Z" fill="#F0F0F0" />
          <path d="M0 0 L 12 6 L 0 12 Z" fill="#D80027" />
          <path d="M1 0 V 12 M 0 1 H 12 M 0 11 H 12 M 11 0 V 12" stroke="#F0F0F0" strokeWidth="0.5" />
          <path d="M20 6 L 20.5 7 L 21.5 7 L 20.75 8 L 21 9 L 20 8.5 L 19 9 L 19.25 8 L 18.5 7 L 19.5 7 Z" fill="#F0F0F0" />
          <path d="M16 17 L 16.25 17.5 L 16.75 17.5 L 16.25 18 L 16.5 18.5 L 16 18.25 L 15.5 18.5 L 15.75 18 L 15.25 17.5 L 15.75 17.5 Z" fill="#F0F0F0" />
          <path d="M20 17 L 20.25 17.5 L 20.75 17.5 L 20.25 18 L 20.5 18.5 L 20 18.25 L 19.5 18.5 L 19.75 18 L 19.25 17.5 L 19.75 17.5 Z" fill="#F0F0F0" />
          <path d="M18 14 L 18.25 14.5 L 18.75 14.5 L 18.25 15 L 18.5 15.5 L 18 15.25 L 17.5 15.5 L 17.75 15 L 17.25 14.5 L 17.75 14.5 Z" fill="#F0F0F0" />
          <path d="M18 19 L 18.25 19.5 L 18.75 19.5 L 18.25 20 L 18.5 20.5 L 18 20.25 L 17.5 20.5 L 17.75 20 L 17.25 19.5 L 17.75 19.5 Z" fill="#F0F0F0" />
        </svg>
      );
    default:
      return <BanknoteIcon className="h-4 w-4 mr-2" />;
  }
};

// Card network icons for credit cards
const CardNetworkIcon = ({ issuer }: { issuer?: string }) => {
  if (!issuer) return <CreditCardIcon className="h-4 w-4 mr-2" />;
  
  switch (issuer.toLowerCase()) {
    case 'visa':
      return (
        <svg className="w-6 h-4 mr-2" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.3736 0H2.63883C1.18106 0 0 1.18106 0 2.63883V13.1942C0 14.6519 1.18106 15.833 2.63883 15.833H21.3736C22.8314 15.833 24.0125 14.6519 24.0125 13.1942V2.63883C24 1.18106 22.8189 0 21.3736 0Z" fill="#2A2A6C"/>
          <path d="M9.93682 10.8916L10.963 5.00049H12.5859L11.5598 10.8916H9.93682Z" fill="#FFAA00"/>
          <path d="M17.113 5.07542C16.7493 4.92552 16.1859 4.76318 15.4854 4.76318C13.8497 4.76318 12.6935 5.62521 12.6811 6.84886C12.6686 7.73333 13.5182 8.22078 14.1564 8.51568C14.8071 8.81058 15.0272 9.00798 15.0272 9.27782C15.0148 9.69772 14.4887 9.89512 14.0 9.89512C13.3119 9.89512 12.9483 9.79007 12.3849 9.53267L12.1773 9.43005L11.9572 10.7411C12.3832 10.9385 13.1584 11.1109 13.9585 11.1234C15.6938 11.1234 16.8251 10.2738 16.8376 8.97514C16.85 8.25213 16.463 7.7022 15.5387 7.24974C14.9877 6.95484 14.6489 6.75744 14.6489 6.46253C14.6614 6.19269 14.9504 5.9229 15.5138 5.9229C15.9889 5.90801 16.3401 6.03794 16.6042 6.16787L16.7466 6.2331L16.9667 4.96126L17.113 5.07542Z" fill="#FFAA00"/>
          <path d="M19.5009 5.00049H18.1918C17.867 5.00049 17.6219 5.10291 17.4891 5.46019L15.373 10.8916H17.108L17.4329 10.0173H19.3678L19.5631 10.8916H21.0955L19.5009 5.00049ZM17.8172 8.77661L18.4927 6.70457L18.8424 8.77661H17.8172Z" fill="#FFAA00"/>
          <path d="M7.98915 5.00049L6.40448 8.96198L6.24219 8.14179C5.95972 7.14397 5.02993 6.07359 4.00723 5.55105L5.44758 10.8916H7.19498L9.71409 5.00049H7.98915Z" fill="#FFAA00"/>
          <path d="M3.6127 5.00049H0.813965L0.776123 5.16283C3.01233 5.674 4.52923 6.79201 5.12777 8.12902L4.4399 5.47403C4.30704 5.1225 4.021 5.01261 3.6127 5.00049Z" fill="#FFAA00"/>
        </svg>
      );
    case 'mastercard':
      return (
        <svg className="w-6 h-4 mr-2" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.3736 0H2.63883C1.18106 0 0 1.18106 0 2.63883V13.1942C0 14.6519 1.18106 15.833 2.63883 15.833H21.3736C22.8314 15.833 24.0125 14.6519 24.0125 13.1942V2.63883C24 1.18106 22.8189 0 21.3736 0Z" fill="#FFFFFF"/>
          <path d="M14.8748 3.46289H9.12477V12.3701H14.8748V3.46289Z" fill="#FF5A00"/>
          <path d="M9.54467 7.91647C9.54467 6.16906 10.438 4.61948 11.8583 3.67725C10.7518 2.81523 9.32387 2.30291 7.77416 2.30291C3.90915 2.30291 0.776123 4.8144 0.776123 7.91647C0.776123 11.0185 3.90915 13.53 7.77416 13.53C9.32387 13.53 10.7518 13.0177 11.8583 12.1557C10.438 11.2135 9.54467 9.66388 9.54467 7.91647Z" fill="#EB001B"/>
          <path d="M23.2237 7.91647C23.2237 11.0185 20.0907 13.53 16.2257 13.53C14.676 13.53 13.248 13.0177 12.1416 12.1557C13.5619 11.2135 14.4553 9.66388 14.4553 7.91647C14.4553 6.16906 13.5619 4.61948 12.1416 3.67725C13.248 2.81523 14.676 2.30291 16.2257 2.30291C20.0907 2.30291 23.2237 4.8144 23.2237 7.91647Z" fill="#F79E1B"/>
        </svg>
      );
    case 'amex':
      return (
        <svg className="w-6 h-4 mr-2" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.3736 0H2.63883C1.18106 0 0 1.18106 0 2.63883V13.1942C0 14.6519 1.18106 15.833 2.63883 15.833H21.3736C22.8314 15.833 24.0125 14.6519 24.0125 13.1942V2.63883C24 1.18106 22.8189 0 21.3736 0Z" fill="#016FD0"/>
          <path d="M10.6135 7.91647L9.14807 4.85444L7.66992 7.91647H10.6135Z" fill="white"/>
          <path d="M11.8582 5.75385H15.0656V6.58078H12.0034V7.34855H14.9704V8.13876H12.0034V8.93143H15.0656V9.7709H11.8582V5.75385Z" fill="white"/>
          <path d="M19.6684 5.75385L18.7376 7.12176L17.8069 5.75385H15.5039L17.2019 8.47606L15.3887 11.3678H17.5367L18.7252 9.78334L19.9136 11.3678H22.0616L20.2485 8.47606L21.9465 5.75385H19.6684Z" fill="white"/>
          <path d="M3.96997 5.75385V11.3431H5.93343V9.34603H8.43986L9.91801 11.3431H12.1466L10.5856 9.22856C11.3733 8.96621 11.8359 8.27099 11.8359 7.40896C11.8359 6.13712 10.8803 5.75385 9.53475 5.75385H3.96997ZM5.94586 6.60814H8.96462C9.44963 6.60814 9.84533 6.83539 9.84533 7.39654C9.84533 7.93396 9.46206 8.16367 8.96462 8.16367H5.94586V6.60814Z" fill="white"/>
        </svg>
      );
    default:
      // Fallback to generic credit card icon
      return <CreditCardIcon className="h-4 w-4 mr-2" />;
  }
};

const PaymentCardRender = ({ paymentMethods }: { paymentMethods: PaymentMethod[] }) => {
  return (
    <>
      {paymentMethods.map((method) => (
        <SelectItem key={method.id} value={method.id}>
          <div className="flex items-center">
            {method.type === 'cash' ? (
              <CurrencyFlag currency={method.currency} />
            ) : (
              <CardNetworkIcon issuer={method.issuer} />
            )}
            <span>
              {method.type === 'credit_card' && method.issuer ? `${method.issuer} ` : ''}
              {method.name}
              {method.lastFourDigits ? ` (${method.lastFourDigits})` : ''}
            </span>
          </div>
        </SelectItem>
      ))}
    </>
  );
};

export default PaymentCardRender;
