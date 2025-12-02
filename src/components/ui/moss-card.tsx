import * as React from 'react';
import { cn } from '@/lib/utils';

interface MossCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean; // Enable hover effect for desktop
}

export const MossCard: React.FC<MossCardProps> = ({
  children,
  className,
  hover = false,
}) => {
  return (
    <div
      className={cn(
        'moss-card',
        hover && 'moss-card-hover',
        className
      )}
      style={{
        backgroundColor: 'var(--color-card-bg)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-xl)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      {children}
    </div>
  );
};
