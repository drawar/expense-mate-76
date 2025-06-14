
import React from 'react';
import { BonusTier } from '@/core/rewards/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export interface BonusTierEditorProps {
  tier: BonusTier | null;
  onChange: (tier: BonusTier | null) => void;
  onDelete?: () => void;
}

export const BonusTierEditor: React.FC<BonusTierEditorProps> = ({
  tier,
  onChange,
  onDelete
}) => {
  const handleChange = (field: keyof BonusTier, value: any) => {
    if (!tier) {
      onChange({
        minSpend: 0,
        maxSpend: undefined,
        multiplier: 1,
        [field]: value
      });
    } else {
      onChange({
        ...tier,
        [field]: value
      });
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (onDelete) onDelete();
  };

  if (!tier) {
    return (
      <div className="text-center py-4">
        <Button 
          variant="outline" 
          onClick={() => onChange({ minSpend: 0, maxSpend: undefined, multiplier: 1 })}
        >
          Add Bonus Tier
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="minSpend">Min Spend</Label>
            <Input
              id="minSpend"
              type="number"
              value={tier.minSpend}
              onChange={(e) => handleChange('minSpend', parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label htmlFor="maxSpend">Max Spend</Label>
            <Input
              id="maxSpend"
              type="number"
              value={tier.maxSpend || ''}
              onChange={(e) => handleChange('maxSpend', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="No limit"
            />
          </div>
          
          <div>
            <Label htmlFor="multiplier">Multiplier</Label>
            <Input
              id="multiplier"
              type="number"
              step="0.1"
              value={tier.multiplier}
              onChange={(e) => handleChange('multiplier', parseFloat(e.target.value) || 1)}
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="destructive" size="sm" onClick={handleRemove}>
            Remove Tier
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
