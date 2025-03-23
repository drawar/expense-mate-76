
import React from 'react';
import { PaymentMethod } from '@/types';
import { SelectItem } from '@/components/ui/select';
import { BanknoteIcon, CreditCardIcon } from 'lucide-react';
import { US, SG, JP, IN, CA, EU, GB, AU } from 'country-flag-icons/react/3x2';

// Currency flag components
const CurrencyFlag = ({ currency }: { currency: string }) => {
  switch (currency) {
    case 'USD':
      return <US title="United States" className="w-4 h-4 mr-2" />;
    case 'SGD':
      return <SG title="Singapore" className="w-4 h-4 mr-2" />;
    case 'JPY':
      return <JP title="Japan" className="w-4 h-4 mr-2" />;
    case 'INR':
      return <IN title="India" className="w-4 h-4 mr-2" />;
    case 'CAD':
      return <CA title="Canada" className="w-4 h-4 mr-2" />;
    case 'EUR':
      return <EU title="European Union" className="w-4 h-4 mr-2" />;
    case 'GBP':
      return <GB title="United Kingdom" className="w-4 h-4 mr-2" />;
    case 'AUD':
      return <AU title="Australia" className="w-4 h-4 mr-2" />;
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
