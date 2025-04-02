
import React from 'react';
import { BaseRewardCard } from './BaseRewardCard';

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
  // Define custom styles or logic specific to this card if needed
  const cardStyles = {
    borderColor: '#eb008b', // DBS Woman's World Card pink color
    gradientStart: '#eb008b',
    gradientEnd: '#8b005e'
  };
  
  // Return the BaseRewardCard with DBS-specific information
  return (
    <BaseRewardCard
      title="DBS Woman's World MasterCard"
      pointsInfo={pointsInfo}
      pointsCurrency={pointsInfo.pointsCurrency || 'DBS Points'}
      styles={cardStyles}
      basePointsDescription="1 DBS Point per S$5 spent"
      bonusDescription="9 bonus DBS Points on online transactions"
      bonusCap="2,700 bonus DBS Points per month"
    />
  );
};

/**
 * Wrapper component for use in the CardRegistry and other places
 * where the points data isn't directly available
 */
export const DBSWomansWorldCardWrapper: React.FC<any> = (props) => {
  return <DBSWomansWorldCard pointsInfo={props.pointsInfo || { totalPoints: 0 }} />;
};
