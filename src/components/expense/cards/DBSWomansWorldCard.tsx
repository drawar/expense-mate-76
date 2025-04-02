
import React from 'react';
import { GenericPointsCard } from './GenericPointsCard';

interface DBSWomansWorldCardProps {
  pointsInfo: {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    messageText?: string;
    pointsCurrency?: string;
  };
}

/**
 * Component for displaying DBS Woman's World MasterCard rewards information
 */
export const DBSWomansWorldCard: React.FC<DBSWomansWorldCardProps> = ({ 
  pointsInfo 
}) => {
  // The GenericPointsCard only accepts pointsInfo, so we need to include all the card-specific
  // details in the pointsInfo object itself
  
  // Create a modified pointsInfo with additional metadata if needed
  const enhancedPointsInfo = {
    ...pointsInfo,
    pointsCurrency: pointsInfo.pointsCurrency || 'DBS Points',
    // We can add a message with the specific card details
    messageText: pointsInfo.messageText || 
      "1 DBS Point per S$5 spent + 9 bonus points on online transactions (monthly cap: 2,700 bonus points)"
  };
  
  // GenericPointsCard only accepts the pointsInfo prop
  return <GenericPointsCard pointsInfo={enhancedPointsInfo} />;
};

/**
 * Wrapper component for use in the CardRegistry and other places
 * where the points data isn't directly available
 */
export const DBSWomansWorldCardWrapper: React.FC<any> = (props) => {
  return <DBSWomansWorldCard pointsInfo={props.pointsInfo || { totalPoints: 0 }} />;
};
