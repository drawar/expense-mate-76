import React, { useState, useEffect } from 'react';
import { RewardRule, RuleCondition, BonusTier } from '@/core/rewards/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConditionEditor } from './ConditionEditor';
import { BonusTierEditor } from './BonusTierEditor';

export interface RewardRuleEditorProps {
  rule?: RewardRule | null;
  onSave: (rule: RewardRule) => void;
  onCancel: () => void;
}

export const RewardRuleEditor: React.FC<RewardRuleEditorProps> = ({
  rule,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [enabled, setEnabled] = useState(rule?.enabled || true);
  const [priority, setPriority] = useState(rule?.priority || 1);
  const [conditions, setConditions] = useState<RuleCondition[]>(rule?.conditions || []);
  const [bonusTiers, setBonusTiers] = useState<BonusTier[]>(rule?.reward?.bonusTiers || []);

  useEffect(() => {
    if (rule) {
      setName(rule.name || '');
      setDescription(rule.description || '');
      setEnabled(rule.enabled || true);
      setPriority(rule.priority || 1);
      setConditions(rule.conditions || []);
      setBonusTiers(rule.reward?.bonusTiers || []);
    }
  }, [rule]);

  const handleSave = () => {
    const updatedRule: RewardRule = {
      id: rule?.id || crypto.randomUUID(),
      cardTypeId: rule?.cardTypeId || 'generic',
      name,
      description,
      enabled,
      priority,
      conditions,
      reward: {
        calculationMethod: rule?.reward?.calculationMethod || 'standard',
        baseMultiplier: rule?.reward?.baseMultiplier || 1,
        bonusMultiplier: rule?.reward?.bonusMultiplier || 0,
        pointsRoundingStrategy: rule?.reward?.pointsRoundingStrategy || 'nearest',
        amountRoundingStrategy: rule?.reward?.amountRoundingStrategy || 'floor',
        blockSize: rule?.reward?.blockSize || 1,
        bonusTiers: bonusTiers,
        monthlyCap: rule?.reward?.monthlyCap,
        monthlyMinSpend: rule?.reward?.monthlyMinSpend,
        monthlySpendPeriodType: rule?.reward?.monthlySpendPeriodType,
        pointsCurrency: rule?.reward?.pointsCurrency || 'points'
      },
      createdAt: rule?.createdAt || new Date(),
      updatedAt: new Date()
    };
    onSave(updatedRule);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Rule Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enabled</Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={(checked) => setEnabled(checked)}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input
              type="number"
              id="priority"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
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
            conditions={conditions}
            onChange={(newConditions) => setConditions(newConditions)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bonus Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <BonusTierEditor
            tiers={bonusTiers}
            onChange={(newTiers) => setBonusTiers(newTiers)}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
};

export default RewardRuleEditor;
