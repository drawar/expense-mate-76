
import React, { useState } from 'react';
import { BonusTier } from '@/core/rewards/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrashIcon } from 'lucide-react';

interface BonusTierEditorProps {
  tiers: BonusTier[];
  onChange: (tiers: BonusTier[]) => void;
}

export const BonusTierEditor: React.FC<BonusTierEditorProps> = ({ tiers, onChange }) => {
  const addTier = () => {
    const newTier: BonusTier = {
      minAmount: 0,
      maxAmount: undefined,
      multiplier: 1,
    };
    onChange([...tiers, newTier]);
  };

  const updateTier = (index: number, updates: Partial<BonusTier>) => {
    const updatedTiers = tiers.map((tier, i) => 
      i === index ? { ...tier, ...updates } : tier
    );
    onChange(updatedTiers);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof BonusTier, value: any) => {
    updateTier(index, { [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Bonus Tiers</Label>
        <Button type="button" onClick={addTier} size="sm">
          Add Tier
        </Button>
      </div>

      {tiers.map((tier, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Tier {index + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTier(index)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`tier-${index}-min-amount`}>Min Amount</Label>
                <Input
                  id={`tier-${index}-min-amount`}
                  type="number"
                  value={tier.minAmount || 0}
                  onChange={(e) => handleTierChange(index, 'minAmount', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`tier-${index}-max-amount`}>Max Amount</Label>
                <Input
                  id={`tier-${index}-max-amount`}
                  type="number"
                  value={tier.maxAmount || ''}
                  onChange={(e) => handleTierChange(index, 'maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="No limit"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor={`tier-${index}-multiplier`}>Multiplier</Label>
              <Input
                id={`tier-${index}-multiplier`}
                type="number"
                step="0.1"
                value={tier.multiplier}
                onChange={(e) => handleTierChange(index, 'multiplier', parseFloat(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BonusTierEditor;
