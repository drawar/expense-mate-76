
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RewardRule, RuleCondition, BonusTier } from '@/core/rewards/types';
import { ConditionEditor } from './ConditionEditor';
import { BonusTierEditor } from './BonusTierEditor';

interface RewardRuleEditorProps {
  rule?: RewardRule;
  cardTypeId: string;
  onSave: (rule: RewardRule) => void;
  onCancel: () => void;
}

export const RewardRuleEditor: React.FC<RewardRuleEditorProps> = ({
  rule,
  cardTypeId,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<RewardRule>(() => {
    if (rule) {
      return {
        ...rule,
        createdAt: new Date(rule.createdAt),
        updatedAt: new Date(rule.updatedAt)
      };
    }
    
    return {
      id: crypto.randomUUID(),
      cardTypeId,
      name: '',
      description: '',
      enabled: true,
      priority: 10,
      conditions: [],
      reward: {
        calculationMethod: 'standard',
        baseMultiplier: 1,
        bonusMultiplier: 0,
        pointsRoundingStrategy: 'floor',
        amountRoundingStrategy: 'floor',
        blockSize: 1,
        pointsCurrency: 'Points'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  const handleSave = () => {
    const updatedRule: RewardRule = {
      ...formData,
      updatedAt: new Date()
    };
    onSave(updatedRule);
  };

  const handleConditionsChange = (conditions: RuleCondition[]) => {
    setFormData(prev => ({
      ...prev,
      conditions
    }));
  };

  const handleBonusTiersChange = (bonusTiers: BonusTier[]) => {
    setFormData(prev => ({
      ...prev,
      reward: {
        ...prev.reward,
        bonusTiers
      }
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
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter rule name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter rule description"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(enabled) => setFormData(prev => ({ ...prev, enabled }))}
            />
            <Label htmlFor="enabled">Rule Enabled</Label>
          </div>
          
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
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
            <Label htmlFor="baseMultiplier">Base Multiplier</Label>
            <Input
              id="baseMultiplier"
              type="number"
              step="0.1"
              value={formData.reward.baseMultiplier}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                reward: { ...prev.reward, baseMultiplier: parseFloat(e.target.value) || 0 }
              }))}
            />
          </div>
          
          <div>
            <Label htmlFor="bonusMultiplier">Bonus Multiplier</Label>
            <Input
              id="bonusMultiplier"
              type="number"
              step="0.1"
              value={formData.reward.bonusMultiplier}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                reward: { ...prev.reward, bonusMultiplier: parseFloat(e.target.value) || 0 }
              }))}
            />
          </div>
          
          <div>
            <Label htmlFor="blockSize">Block Size</Label>
            <Input
              id="blockSize"
              type="number"
              value={formData.reward.blockSize}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                reward: { ...prev.reward, blockSize: parseFloat(e.target.value) || 1 }
              }))}
            />
          </div>
          
          <div>
            <Label htmlFor="pointsCurrency">Points Currency</Label>
            <Input
              id="pointsCurrency"
              value={formData.reward.pointsCurrency}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                reward: { ...prev.reward, pointsCurrency: e.target.value }
              }))}
              placeholder="e.g., Points, Miles, Cashback"
            />
          </div>
          
          <div>
            <Label htmlFor="monthlyCap">Monthly Cap (optional)</Label>
            <Input
              id="monthlyCap"
              type="number"
              value={formData.reward.monthlyCap || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                reward: { ...prev.reward, monthlyCap: e.target.value ? parseInt(e.target.value) : undefined }
              }))}
              placeholder="Enter monthly points cap"
            />
          </div>
          
          <div>
            <Label htmlFor="monthlyMinSpend">Monthly Minimum Spend (optional)</Label>
            <Input
              id="monthlyMinSpend"
              type="number"
              value={formData.reward.monthlyMinSpend || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                reward: { ...prev.reward, monthlyMinSpend: e.target.value ? parseInt(e.target.value) : undefined }
              }))}
              placeholder="Enter minimum monthly spend"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <ConditionEditor
            conditions={formData.conditions}
            onChange={handleConditionsChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bonus Tiers (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <BonusTierEditor
            bonusTiers={formData.reward.bonusTiers || []}
            onChange={handleBonusTiersChange}
          />
        </CardContent>
      </Card>

      <Separator />
      
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

export default RewardRuleEditor;
