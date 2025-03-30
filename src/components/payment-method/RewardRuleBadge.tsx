
import { RewardRule } from '@/types';
import { cn } from '@/lib/utils';

interface RewardRuleBadgeProps {
  rule: RewardRule;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const RewardRuleBadge = ({ rule, variant = 'default', className }: RewardRuleBadgeProps) => {
  // Format the condition for display
  const formatCondition = (condition: string | string[]): string => {
    if (typeof condition === 'string') {
      return condition;
    }
    
    // If it's an array with more than 3 items, show a summary
    if (condition.length > 3) {
      return `${condition.length} categories`;
    }
    
    return condition.join(', ');
  };

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300",
          className
        )}
      >
        {rule.name}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn("space-y-1 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20", className)}>
        <div className="font-medium text-sm text-blue-700 dark:text-blue-300">{rule.name}</div>
        <div className="text-xs text-blue-600/80 dark:text-blue-400/80">{rule.description}</div>
        {rule.pointsMultiplier && (
          <div className="text-xs font-medium text-green-600 dark:text-green-400">
            {rule.pointsMultiplier}x multiplier
          </div>
        )}
        {rule.maxSpend && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Monthly cap: {rule.maxSpend} points
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div 
      className={cn(
        "text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300",
        className
      )}
      title={rule.description}
    >
      {rule.name}
      {rule.pointsMultiplier && (
        <span className="ml-1 font-medium text-green-600 dark:text-green-400">
          {rule.pointsMultiplier}x
        </span>
      )}
    </div>
  );
};

export default RewardRuleBadge;
