
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
      name: `Tier ${tiers.length + 1}`,
      minSpend: 0,
      maxSpend: undefined,
      multiplier: 1,
      priority: tiers.length + 1,
      condition: {
        type: 'mcc',
        operation: 'include',
        values: []
      }
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
    const newTier: BonusTier = {
      ...tiers[index],
      [field]: value
    };
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
                <Label htmlFor={`tier-${index}-min-spend`}>Min Spend</Label>
                <Input
                  id={`tier-${index}-min-spend`}
                  type="number"
                  value={tier.minSpend || 0}
                  onChange={(e) => handleTierChange(index, 'minSpend', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`tier-${index}-max-spend`}>Max Spend</Label>
                <Input
                  id={`tier-${index}-max-spend`}
                  type="number"
                  value={tier.maxSpend || ''}
                  onChange={(e) => handleTierChange(index, 'maxSpend', e.target.value ? parseFloat(e.target.value) : undefined)}
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
