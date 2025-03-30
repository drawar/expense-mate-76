
import { UOBPlatinumCardWrapper } from './UOBPlatinumCardRefactored';
import { UOBSignatureCardWrapper } from './UOBSignatureCardRefactored';
import { CitibankRewardsCardWrapper } from './CitibankRewardsCardRefactored';
import { AmexPlatinumCreditWrapper } from './AmexPlatinumCredit';
import { AmexPlatinumSGWrapper } from './AmexPlatinumSingapore';
import { AmexPlatinumCanadaCardWrapper } from './AmexPlatinumCanada';
import { AmexCobaltCardWrapper } from './AmexCobaltCard';
import { TDAeroplanVisaInfiniteCardWrapper } from './TDAeroplanVisaInfinite';
import { UOBLadysSolitaireCardWrapper } from './UOBLadysSolitaireCard';
import { OCBCRewardsWorldCardWrapper } from './OCBCRewardsWorldCard';
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
    description: 'Earn 10X UNI$ (or 4 miles) per $5 on online, contactless and selected category spend.'
  },
  {
    id: 'uob-visa-signature',
    issuer: 'UOB',
    name: 'Visa Signature',
    pointsCurrency: 'UNI$',
    component: UOBSignatureCardWrapper,
    description: 'Earn 10X UNI$ (or 4 miles) on all foreign currency spend.'
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
    pointsCurrency: 'SG MR Points',
    component: AmexPlatinumCreditWrapper,
    description: 'Earn 2 Membership Rewards points for every $1.60 spent.'
  },
  {
    id: 'amex-platinum-sg',
    issuer: 'American Express',
    name: 'Platinum Singapore',
    pointsCurrency: 'SG MR Points',
    component: AmexPlatinumSGWrapper,
    description: 'Earn 2 Membership Rewards points for every $1.60 spent.'
  },
  {
    id: 'amex-platinum-canada',
    issuer: 'American Express',
    name: 'Platinum Canada',
    pointsCurrency: 'CA MR Points',
    component: AmexPlatinumCanadaCardWrapper,
    description: 'Earn up to 3X MR points on travel and dining purchases.'
  },
  {
    id: 'amex-cobalt',
    issuer: 'American Express',
    name: 'Cobalt',
    pointsCurrency: 'CA MR Points',
    component: AmexCobaltCardWrapper,
    description: 'Earn 5X MR points on eats & drinks, 3X on streaming, 2X on travel, and 1X on all else.'
  },
  {
    id: 'td-aeroplan-visa-infinite',
    issuer: 'TD',
    name: 'Aeroplan Visa Infinite',
    pointsCurrency: 'Aeroplan Points',
    component: TDAeroplanVisaInfiniteCardWrapper,
    description: 'Earn 1.5X Aeroplan points on gas, grocery and Air Canada purchases.'
  },
  {
    id: 'uob-ladys-solitaire',
    issuer: 'UOB',
    name: 'Lady\'s Solitaire',
    pointsCurrency: 'UNI$',
    component: UOBLadysSolitaireCardWrapper,
    description: 'Earn 10X UNI$ on your two preferred categories, up to 7,200 bonus points per month.'
  },
  {
    id: 'ocbc-rewards-world',
    issuer: 'OCBC',
    name: 'Rewards World Mastercard',
    pointsCurrency: 'OCBC$',
    component: OCBCRewardsWorldCardWrapper,
    description: 'Earn up to 30x OCBC$ on shopping, dining, and e-commerce.'
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
