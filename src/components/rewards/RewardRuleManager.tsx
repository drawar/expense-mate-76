
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus } from 'lucide-react';
import { RewardRule } from '@/core/rewards/types';
import { RuleRepository } from '@/core/rewards/RuleRepository';
import { RewardRuleEditor } from './RewardRuleEditor';

export const RewardRuleManager: React.FC = () => {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [selectedCardType, setSelectedCardType] = useState<string>('');
  const [editingRule, setEditingRule] = useState<RewardRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const ruleRepository = RuleRepository.getInstance();

  // Load rules when component mounts or card type changes
  useEffect(() => {
    if (selectedCardType) {
      loadRules();
    }
  }, [selectedCardType]);

  const loadRules = async () => {
    if (!selectedCardType) return;
    
    setLoading(true);
    try {
      const cardRules = await ruleRepository.getRulesForCardType(selectedCardType);
      setRules(cardRules);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setIsCreating(true);
    setEditingRule({
      id: '',
      cardTypeId: selectedCardType,
      name: 'New Rule',
      description: '',
      enabled: true,
      priority: 1,
      conditions: [],
      reward: {
        calculationMethod: 'standard',
        baseMultiplier: 1,
        bonusMultiplier: 0,
        pointsRoundingStrategy: 'floor',
        amountRoundingStrategy: 'floor',
        blockSize: 1,
        pointsCurrency: 'points',
        bonusTiers: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  const handleEditRule = (rule: RewardRule) => {
    setIsCreating(false);
    setEditingRule(rule);
  };

  const handleSaveRule = async (rule: RewardRule) => {
    try {
      const savedRule = await ruleRepository.saveRule(rule);
      if (savedRule) {
        setEditingRule(null);
        setIsCreating(false);
        await loadRules(); // Reload rules to get updated list
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const success = await ruleRepository.deleteRule(ruleId);
      if (success) {
        await loadRules(); // Reload rules to get updated list
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleCancel = () => {
    setEditingRule(null);
    setIsCreating(false);
  };

  // Available card types - this could be moved to a configuration file
  const cardTypes = [
    { id: 'uob-one', name: 'UOB One Card' },
    { id: 'dbs-pv', name: 'DBS Paylah! Visa' },
    { id: 'citibank-premier', name: 'Citibank Premier Miles' },
    { id: 'amex-platinum', name: 'American Express Platinum' },
    { id: 'generic', name: 'Generic Card' }
  ];

  if (editingRule) {
    return (
      <RewardRuleEditor
        rule={editingRule}
        onSave={handleSaveRule}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reward Rule Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cardType">Card Type</Label>
            <Select
              value={selectedCardType}
              onValueChange={setSelectedCardType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a card type" />
              </SelectTrigger>
              <SelectContent>
                {cardTypes.map((cardType) => (
                  <SelectItem key={cardType.id} value={cardType.id}>
                    {cardType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCardType && (
            <Button onClick={handleCreateRule}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Rule
            </Button>
          )}
        </CardContent>
      </Card>

      {selectedCardType && (
        <Card>
          <CardHeader>
            <CardTitle>Rules for {cardTypes.find(ct => ct.id === selectedCardType)?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading rules...</div>
            ) : rules.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No rules found for this card type.
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => (
                  <Card key={rule.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <Badge variant="outline">Priority: {rule.priority}</Badge>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {rule.description}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          Base: {rule.reward.baseMultiplier}x | 
                          Bonus: {rule.reward.bonusMultiplier}x | 
                          Currency: {rule.reward.pointsCurrency}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
