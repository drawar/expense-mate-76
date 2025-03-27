
import { UOBPlatinumCardWrapper } from './UOBPlatinumCardRefactored';
import { UOBSignatureCardWrapper } from './UOBSignatureCardRefactored';
import { CitibankRewardsCardWrapper } from './CitibankRewardsCardRefactored';
import { AmexPlatinumCreditWrapper } from './AmexPlatinumCredit';
import { AmexPlatinumSGWrapper } from './AmexPlatinumSingapore';
import { PaymentMethod } from '@/types';

// Interface for card metadata
export interface CardMetadata {
  id: string;
  issuer: string;
  name: string;
  pointsCurrency: string;
  component: React.FC<any>;
  description?: string;
}

// Registry of all available cards
const cardsRegistry: CardMetadata[] = [
  {
    id: 'uob-preferred-platinum',
    issuer: 'UOB',
    name: 'Preferred Visa Platinum',
    pointsCurrency: 'UNI$',
    component: UOBPlatinumCardWrapper,
    description: 'Earn 10X UNI$ (or 20 miles) per $5 on online, contactless and selected category spend.'
  },
  {
    id: 'uob-visa-signature',
    issuer: 'UOB',
    name: 'Visa Signature',
    pointsCurrency: 'UNI$',
    component: UOBSignatureCardWrapper,
    description: 'Earn 10X UNI$ (or 20 miles) on all foreign currency spend.'
  },
  {
    id: 'citibank-rewards',
    issuer: 'Citibank',
    name: 'Rewards Visa Signature',
    pointsCurrency: 'ThankYou Points',
    component: CitibankRewardsCardWrapper,
    description: 'Earn 10X ThankYou Points on online shopping and department store spending.'
  },
  {
    id: 'amex-platinum-credit',
    issuer: 'American Express',
    name: 'Platinum Credit',
    pointsCurrency: 'MR (Credit Card)',
    component: AmexPlatinumCreditWrapper,
    description: 'Earn 2 Membership Rewards points for every $1.60 spent.'
  },
  {
    id: 'amex-platinum-sg',
    issuer: 'American Express',
    name: 'Platinum Singapore',
    pointsCurrency: 'MR (Charge Card)',
    component: AmexPlatinumSGWrapper,
    description: 'Earn 2 Membership Rewards points for every $1.60 spent.'
  }
];

// Utility functions for the registry
export const CardRegistry = {
  // Get all cards in the registry
  getAllCards: (): CardMetadata[] => {
    return cardsRegistry;
  },
  
  // Find a card by issuer and name
  findCard: (issuer: string, name: string): CardMetadata | undefined => {
    return cardsRegistry.find(card => 
      card.issuer.toLowerCase() === issuer.toLowerCase() && 
      card.name.toLowerCase() === name.toLowerCase()
    );
  },
  
  // Find a card by id
  getCardById: (id: string): CardMetadata | undefined => {
    return cardsRegistry.find(card => card.id === id);
  },
  
  // Get all cards for a specific issuer
  getCardsByIssuer: (issuer: string): CardMetadata[] => {
    return cardsRegistry.filter(card => 
      card.issuer.toLowerCase() === issuer.toLowerCase()
    );
  },
  
  // Get cards by points currency
  getCardsByPointsCurrency: (currency: string): CardMetadata[] => {
    return cardsRegistry.filter(card => 
      card.pointsCurrency.toLowerCase() === currency.toLowerCase()
    );
  },
  
  // Get component for payment method
  getComponentForPaymentMethod: (paymentMethod: PaymentMethod) => {
    const card = cardsRegistry.find(c => 
      c.issuer === paymentMethod.issuer && 
      c.name === paymentMethod.name
    );
    
    return card?.component;
  }
};
