
import React, { useState, useEffect } from 'react';
import { RewardRule, RuleCondition, BonusTier } from '@/core/rewards/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConditionEditor } from './ConditionEditor';
import { BonusTierEditor } from './BonusTierEditor';

interface RewardRuleEditorProps {
  rule?: RewardRule;
  onSave: (rule: RewardRule) => Promise<void>;
  onCancel: () => void;
}

export const RewardRuleEditor: React.FC<RewardRuleEditorProps> = ({ rule, onSave, onCancel }) => {
  const [editRule, setEditRule] = useState<RewardRule>(() => {
    return rule || {
      id: '',
      cardTypeId: '',
      name: '',
      description: '',
      enabled: true,
      priority: 1,
      conditions: [],
      reward: {
        calculationMethod: 'standard',
        baseMultiplier: 1,
        bonusMultiplier: 1,
        pointsRoundingStrategy: 'floor',
        amountRoundingStrategy: 'floor',
        blockSize: 1,
        pointsCurrency: 'points',
        bonusTiers: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  const handleSave = async () => {
    try {
      await onSave({
        ...editRule,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const updateReward = (updates: Partial<typeof editRule.reward>) => {
    setEditRule(prev => ({
      ...prev,
      reward: {
        ...prev.reward,
        ...updates
      },
      updatedAt: new Date()
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={editRule.name}
              onChange={(e) => setEditRule(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter rule name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editRule.description}
              onChange={(e) => setEditRule(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter rule description"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={editRule.enabled}
              onCheckedChange={(checked) => setEditRule(prev => ({ ...prev, enabled: checked }))}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>
          
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={editRule.priority}
              onChange={(e) => setEditRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
              min="1"
              max="100"
            />
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
              value={editRule.reward.calculationMethod}
              onValueChange={(value: 'standard' | 'direct') => updateReward({ calculationMethod: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="baseMultiplier">Base Multiplier</Label>
              <Input
                id="baseMultiplier"
                type="number"
                step="0.1"
                value={editRule.reward.baseMultiplier}
                onChange={(e) => updateReward({ baseMultiplier: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="bonusMultiplier">Bonus Multiplier</Label>
              <Input
                id="bonusMultiplier"
                type="number"
                step="0.1"
                value={editRule.reward.bonusMultiplier}
                onChange={(e) => updateReward({ bonusMultiplier: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="blockSize">Block Size</Label>
              <Input
                id="blockSize"
                type="number"
                value={editRule.reward.blockSize}
                onChange={(e) => updateReward({ blockSize: parseInt(e.target.value) || 1 })}
              />
            </div>
            
            <div>
              <Label htmlFor="pointsCurrency">Points Currency</Label>
              <Input
                id="pointsCurrency"
                value={editRule.reward.pointsCurrency}
                onChange={(e) => updateReward({ pointsCurrency: e.target.value })}
                placeholder="points"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthlyCap">Monthly Cap</Label>
              <Input
                id="monthlyCap"
                type="number"
                value={editRule.reward.monthlyCap || ''}
                onChange={(e) => updateReward({ monthlyCap: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="No cap"
              />
            </div>
            
            <div>
              <Label htmlFor="monthlyMinSpend">Monthly Min Spend</Label>
              <Input
                id="monthlyMinSpend"
                type="number"
                value={editRule.reward.monthlyMinSpend || ''}
                onChange={(e) => updateReward({ monthlyMinSpend: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="No minimum"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <ConditionEditor
            conditions={editRule.conditions}
            onChange={(conditions) => setEditRule(prev => ({ ...prev, conditions }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bonus Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <BonusTierEditor
            bonusTiers={editRule.reward.bonusTiers || []}
            onChange={(bonusTiers) => updateReward({ bonusTiers })}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Rule
        </Button>
      </div>
    </div>
  );
};
