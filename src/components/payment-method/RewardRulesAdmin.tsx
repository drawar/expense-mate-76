
import React from 'react';
import { PaymentMethod, RewardRule } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RewardRuleBadge from './RewardRuleBadge';
import { CoinsIcon, TagIcon } from 'lucide-react';

interface RewardRulesAdminProps {
  paymentMethod: PaymentMethod;
}

const RewardRulesAdmin: React.FC<RewardRulesAdminProps> = ({ paymentMethod }) => {
  const { rewardRules = [] } = paymentMethod;

  if (!rewardRules || rewardRules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CoinsIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p>No reward rules configured for this card.</p>
        <p className="text-sm mt-2">Reward rules will be pulled automatically from the card registry.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {rewardRules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </div>
    </div>
  );
};

const RuleCard: React.FC<{ rule: RewardRule }> = ({ rule }) => {
  // Format condition for display
  const formatCondition = (condition: string | string[]): React.ReactNode => {
    if (typeof condition === 'string') {
      return <span>{condition}</span>;
    }
    
    if (condition.length === 0) {
      return <span className="text-muted-foreground">No conditions</span>;
    }
    
    if (condition.length > 10) {
      // Show first few and count
      return (
        <div>
          <div className="flex flex-wrap gap-1 mb-2">
            {condition.slice(0, 10).map((item, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            + {condition.length - 10} more categories
          </p>
        </div>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {condition.map((item, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{rule.name}</CardTitle>
            <CardDescription>{rule.description}</CardDescription>
          </div>
          <Badge 
            className={cn(
              "px-2 py-0.5",
              rule.pointsMultiplier && rule.pointsMultiplier > 5 ? "bg-green-500" : "bg-blue-500"
            )}
          >
            {rule.pointsMultiplier}x
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium flex items-center gap-1 mb-1">
              <TagIcon className="h-3 w-3 mr-1" />
              Rule Type: {rule.type.toUpperCase()}
            </p>
            <div className="text-sm">{formatCondition(rule.condition)}</div>
          </div>
          
          {rule.maxSpend && (
            <div className="text-sm">
              <span className="font-medium">Monthly Cap:</span> {rule.maxSpend} points
            </div>
          )}
          
          {rule.pointsCurrency && (
            <div className="text-sm">
              <span className="font-medium">Points Currency:</span> {rule.pointsCurrency}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default RewardRulesAdmin;
