
import React, { useState, useEffect } from 'react';
import { RewardRule } from '@/core/rewards/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RewardRuleEditor } from './RewardRuleEditor';
import { getRuleRepository } from '@/core/rewards/RuleRepository';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';

interface RewardRuleManagerProps {
  // No props needed - component manages its own state
}

export const RewardRuleManager: React.FC<RewardRuleManagerProps> = () => {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<RewardRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const repository = getRuleRepository();
      const loadedRules = await repository.getRulesForCardType('generic');
      setRules(loadedRules);
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  const handleCreateRule = () => {
    setSelectedRule(null);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEditRule = (rule: RewardRule) => {
    setSelectedRule(rule);
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleSaveRule = async (rule: RewardRule) => {
    try {
      const repository = getRuleRepository();
      
      if (isCreating) {
        const newRule = await repository.createRule({
          cardTypeId: 'generic',
          name: rule.name,
          description: rule.description,
          enabled: rule.enabled,
          priority: rule.priority,
          conditions: rule.conditions,
          reward: rule.reward
        });
        setRules([...rules, newRule]);
      } else {
        await repository.updateRule(rule);
        setRules(rules.map(r => r.id === rule.id ? rule : r));
      }
      
      setIsEditing(false);
      setSelectedRule(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const repository = getRuleRepository();
      await repository.deleteRule(ruleId);
      setRules(rules.filter(r => r.id !== ruleId));
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedRule(null);
    setIsCreating(false);
  };

  if (isEditing) {
    return (
      <RewardRuleEditor
        rule={selectedRule}
        onSave={handleSaveRule}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reward Rules</h2>
        <Button onClick={handleCreateRule}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {rule.name}
                    <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rule.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p><strong>Priority:</strong> {rule.priority}</p>
                <p><strong>Conditions:</strong> {rule.conditions.length} condition(s)</p>
                <p><strong>Base Multiplier:</strong> {rule.reward.baseMultiplier}x</p>
                <p><strong>Points Currency:</strong> {rule.reward.pointsCurrency}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {rules.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No rules configured yet.</p>
              <Button onClick={handleCreateRule} className="mt-4">
                Create your first rule
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RewardRuleManager;
