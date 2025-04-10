// components/rewards/BonusTierEditor.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash, Edit } from 'lucide-react';
import { BonusTier, RuleCondition } from '@/services/rewards/types';
import { ConditionEditor } from './ConditionEditor';

interface BonusTierEditorProps {
  tier: BonusTier;
  onChange: (tier: BonusTier) => void;
  onDelete: () => void;
}

export const BonusTierEditor: React.FC<BonusTierEditorProps> = ({
  tier,
  onChange,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle tier name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...tier,
      name: e.target.value
    });
  };
  
  // Handle tier multiplier change
  const handleMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) return;
    
    onChange({
      ...tier,
      multiplier: value
    });
  };
  
  // Handle tier priority change
  const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) return;
    
    onChange({
      ...tier,
      priority: value
    });
  };
  
  // Handle condition change
  const handleConditionChange = (condition: RuleCondition) => {
    onChange({
      ...tier,
      condition
    });
  };
  
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          {isEditing ? (
            <Input
              value={tier.name}
              onChange={handleNameChange}
              placeholder="Tier Name"
              className="font-semibold"
            />
          ) : (
            <CardTitle className="text-base">{tier.name}</CardTitle>
          )}
          <div className="flex space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-7 w-7 p-0"
            >
              <Edit size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 w-7 p-0"
            >
              <Trash size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {isEditing ? (
            <>
              <div>
                <Label htmlFor="multiplier" className="text-xs">Bonus Multiplier</Label>
                <Input
                  id="multiplier"
                  type="number"
                  step="0.1"
                  value={tier.multiplier}
                  onChange={handleMultiplierChange}
                  placeholder="e.g., 1.8 for 9x per $5"
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="priority" className="text-xs">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={tier.priority}
                  onChange={handlePriorityChange}
                  placeholder="Higher values take precedence"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Condition</Label>
                <ConditionEditor
                  condition={tier.condition}
                  onChange={handleConditionChange}
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-sm">
                <span className="font-medium">Multiplier:</span> {tier.multiplier}x
              </div>
              <div className="text-sm">
                <span className="font-medium">Priority:</span> {tier.priority}
              </div>
              <div>
                <span className="font-medium text-sm">Condition Type:</span>
                <div className="pl-2 mt-1 text-sm">
                  {tier.condition.type === 'compound' 
                    ? `Compound (${tier.condition.operation === 'all' ? 'AND' : 'OR'})` 
                    : tier.condition.type}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
