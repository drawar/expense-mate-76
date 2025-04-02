
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
  // Define custom styles specific to this card
  const cardStyles = {
    borderColor: '#eb008b', // DBS Woman's World Card pink color
    gradientStart: '#eb008b',
    gradientEnd: '#8b005e'
  };
  
  // Return the GenericPointsCard with DBS-specific information
  return (
    <GenericPointsCard
      title="DBS Woman's World MasterCard"
      pointsInfo={pointsInfo}
      pointsCurrency={pointsInfo.pointsCurrency || 'DBS Points'}
      basePointsDescription="1 DBS Point per S$5 spent"
      bonusDescription="9 bonus DBS Points on online transactions"
      bonusCap="Monthly cap: 2,700 bonus DBS Points"
      styles={cardStyles}
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
