
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConditionEditor } from './ConditionEditor';
import { BonusTierEditor } from './BonusTierEditor';
import { RewardRule, RuleCondition, BonusTier } from '@/core/rewards/types';

interface RewardRuleEditorProps {
  rule?: RewardRule;
  onSave: (rule: RewardRule) => void;
  onCancel: () => void;
}

export const RewardRuleEditor: React.FC<RewardRuleEditorProps> = ({
  rule,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<RewardRule>(() => {
    if (rule) {
      return {
        ...rule,
        // Ensure dates are Date objects
        createdAt: rule.createdAt instanceof Date ? rule.createdAt : new Date(rule.createdAt.toString()),
        updatedAt: rule.updatedAt instanceof Date ? rule.updatedAt : new Date(rule.updatedAt.toString())
      };
    }
    
    return {
      id: '',
      cardTypeId: '',
      name: '',
      description: '',
      enabled: true,
      priority: 0,
      conditions: [],
      reward: {
        type: 'points',
        calculationMethod: 'standard',
        baseMultiplier: 1,
        blockSize: 1,
        pointsCurrency: 'points',
        bonusTiers: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field: keyof RewardRule, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date()
    }));
  };

  const updateRewardField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      reward: {
        ...prev.reward,
        [field]: value
      },
      updatedAt: new Date()
    }));
  };

  const updateConditions = (conditions: RuleCondition[]) => {
    updateField('conditions', conditions);
  };

  const updateBonusTiers = (bonusTiers: BonusTier[]) => {
    updateRewardField('bonusTiers', bonusTiers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter rule name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Enter rule description"
            />
          </div>

          <div>
            <Label htmlFor="cardTypeId">Card Type ID</Label>
            <Input
              id="cardTypeId"
              value={formData.cardTypeId}
              onChange={(e) => updateField('cardTypeId', e.target.value)}
              placeholder="Enter card type ID"
              required
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => updateField('priority', parseInt(e.target.value) || 0)}
              placeholder="Enter priority (higher = more important)"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => updateField('enabled', checked)}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reward Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="calculationMethod">Calculation Method</Label>
            <Select
              value={formData.reward.calculationMethod}
              onValueChange={(value) => updateRewardField('calculationMethod', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="tiered">Tiered</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="baseMultiplier">Base Multiplier</Label>
            <Input
              id="baseMultiplier"
              type="number"
              step="0.01"
              value={formData.reward.baseMultiplier}
              onChange={(e) => updateRewardField('baseMultiplier', parseFloat(e.target.value) || 1)}
            />
          </div>

          <div>
            <Label htmlFor="blockSize">Block Size</Label>
            <Input
              id="blockSize"
              type="number"
              step="0.01"
              value={formData.reward.blockSize}
              onChange={(e) => updateRewardField('blockSize', parseFloat(e.target.value) || 1)}
            />
          </div>

          <div>
            <Label htmlFor="pointsCurrency">Points Currency</Label>
            <Input
              id="pointsCurrency"
              value={formData.reward.pointsCurrency}
              onChange={(e) => updateRewardField('pointsCurrency', e.target.value)}
              placeholder="e.g., points, miles, cashback"
            />
          </div>

          {formData.reward.monthlyCap && (
            <div>
              <Label htmlFor="monthlyCap">Monthly Cap</Label>
              <Input
                id="monthlyCap"
                type="number"
                value={formData.reward.monthlyCap}
                onChange={(e) => updateRewardField('monthlyCap', parseFloat(e.target.value) || undefined)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <ConditionEditor
            conditions={formData.conditions}
            onChange={updateConditions}
          />
        </CardContent>
      </Card>

      {formData.reward.calculationMethod === 'tiered' && (
        <Card>
          <CardHeader>
            <CardTitle>Bonus Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <BonusTierEditor
              tiers={formData.reward.bonusTiers}
              onChange={updateBonusTiers}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Rule
        </Button>
      </div>
    </form>
  );
};

export default RewardRuleEditor;
