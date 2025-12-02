import React from 'react';
import { cn } from '@/lib/utils';

interface RewardPointsPanelProps {
  totalPoints: number;
  bonusPoints?: number;
  currency: string;
  className?: string;
}

export const RewardPointsPanel: React.FC<RewardPointsPanelProps> = ({
  totalPoints,
  bonusPoints = 0,
  currency,
  className,
}) => {
  return (
    <div
      className={cn('reward-points-panel', className)}
      role="status"
      aria-live="polite"
      aria-label="Reward points calculation"
    >
      {/* Icon */}
      <span
        style={{
          fontSize: '20px',
          color: 'var(--color-icon-primary)',
        }}
        aria-hidden="true"
      >
        💳
      </span>
      
      {/* Label */}
      <span
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-body)',
          fontWeight: 500,
        }}
      >
        Reward Points
      </span>
      
      {/* Total Points Badge */}
      <div className="points-badge">
        {totalPoints.toFixed(0)} {currency}
      </div>
      
      {/* Bonus Points Badge (if applicable) */}
      {bonusPoints > 0 && (
        <div className="bonus-badge">
          +{bonusPoints.toFixed(0)} bonus
        </div>
      )}
    </div>
  );
};
