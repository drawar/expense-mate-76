
// components/rewards/RewardRuleManager.tsx

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CoinsIcon, Plus, PencilIcon, TrashIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RewardRule } from '@/core/rewards/types';
import { RuleRepository } from '@/core/rewards/RuleRepository';
import { CardRegistry } from '@/core/rewards/CardRegistry';
import RewardRuleEditor from './RewardRuleEditor';

interface RewardRuleManagerProps {
  cardTypeId: string;
}

export const RewardRuleManager: React.FC<RewardRuleManagerProps> = ({ cardTypeId }) => {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RewardRule | undefined>(undefined);
  const { toast } = useToast();
  
  const ruleRepository = RuleRepository.getInstance();
  const cardRegistry = CardRegistry.getInstance();
  
  // Load rules when component mounts
  useEffect(() => {
    const loadRules = async () => {
      try {
        setIsLoading(true);
        const loadedRules = await ruleRepository.getRulesForCardType(cardTypeId);
        setRules(loadedRules);
      } catch (error) {
        console.error('Error loading rules:', error);
        toast({
          title: 'Error',
          description: 'Failed to load reward rules',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRules();
  }, [cardTypeId, toast]);
  
  // Get card name for display
  const getCardName = (): string => {
    const cardType = cardRegistry.getCardType(cardTypeId);
    if (cardType) {
      return `${cardType.issuer} ${cardType.name}`;
    }
    return cardTypeId;
  };
  
  // Handle adding a new rule
  const handleAddRule = () => {
    setEditingRule(undefined);
    setIsDialogOpen(true);
  };
  
  // Handle editing an existing rule
  const handleEditRule = (rule: RewardRule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };
  
  // Handle saving a rule
  const handleSaveRule = async (rule: RewardRule) => {
    try {
      // Set the cardTypeId if it's a new rule
      const ruleToSave = { ...rule, cardTypeId };
      const savedRule = await ruleRepository.saveRule(ruleToSave);
      
      if (savedRule) {
        // Update local rules state
        const isNewRule = !rules.some(r => r.id === savedRule.id);
        
        if (isNewRule) {
          setRules(prev => [...prev, savedRule]);
        } else {
          setRules(prev => prev.map(r => r.id === savedRule.id ? savedRule : r));
        }
        
        toast({
          title: 'Success',
          description: `Rule ${isNewRule ? 'created' : 'updated'} successfully`,
        });
        
        setIsDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save rule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rule',
        variant: 'destructive',
      });
    }
  };
  
  // Handle deleting a rule
  const handleDeleteRule = async (ruleId: string) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }
    
    try {
      const success = await ruleRepository.deleteRule(ruleId);
      
      if (success) {
        // Update local rules state
        setRules(prev => prev.filter(r => r.id !== ruleId));
        
        toast({
          title: 'Success',
          description: 'Rule deleted successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete rule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete rule',
        variant: 'destructive',
      });
    }
  };
  
  // Format condition for display
  const formatCondition = (rule: RewardRule): string => {
    const conditions = rule.conditions;
    
    if (!conditions || conditions.length === 0) {
      return 'All transactions';
    }
    
    const parts: string[] = [];
    
    // Check for transaction type
    const transactionTypeCondition = conditions.find(c => c.type === 'transaction_type');
    if (transactionTypeCondition && transactionTypeCondition.values && transactionTypeCondition.values.length > 0) {
      const type = transactionTypeCondition.values[0];
      if (type === 'online') {
        parts.push('Online transactions');
      } else if (type === 'contactless') {
        parts.push('Contactless payments');
      } else if (type === 'in_store') {
        parts.push('In-store transactions');
      }
    }
    
    // Check for MCC codes
    const mccCondition = conditions.find(c => c.type === 'mcc');
    if (mccCondition && mccCondition.values && mccCondition.values.length > 0) {
      const mccCount = mccCondition.values.length;
      parts.push(`${mccCount} MCC code${mccCount > 1 ? 's' : ''}`);
    }
    
    // Check for merchant names
    const merchantCondition = conditions.find(c => c.type === 'merchant');
    if (merchantCondition && merchantCondition.values && merchantCondition.values.length > 0) {
      const merchantCount = merchantCondition.values.length;
      parts.push(`${merchantCount} merchant${merchantCount > 1 ? 's' : ''}`);
    }
    
    return parts.join(', ') || 'Custom conditions';
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CoinsIcon className="h-5 w-5" />
          Reward Rules for {getCardName()}
        </h2>
        <Button onClick={handleAddRule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CoinsIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No reward rules defined for this card type.</p>
            <Button className="mt-4" onClick={handleAddRule}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map(rule => (
            <Card key={rule.id} className={rule.enabled ? undefined : 'opacity-60'}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{rule.name}</CardTitle>
                    <CardDescription>{rule.description}</CardDescription>
                  </div>
                  <Badge 
                    className={rule.enabled ? 'bg-green-500' : 'bg-gray-500'}
                  >
                    {(rule.reward.baseMultiplier + (rule.reward.bonusMultiplier || 0)).toFixed(1)}x
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Conditions:</span> {formatCondition(rule)}
                  </div>
                  <div>
                    <span className="font-medium">Calculation:</span> 
                    {rule.reward.baseMultiplier.toFixed(1)}x base
                    {rule.reward.bonusMultiplier && ` + ${rule.reward.bonusMultiplier.toFixed(1)}x bonus`}
                    {rule.reward.blockSize > 1 ? ` per $${rule.reward.blockSize}` : ' per $1'}
                  </div>
                  {rule.reward.monthlyCap && (
                    <div>
                      <span className="font-medium">Monthly Cap:</span> 
                      {rule.reward.monthlyCap.toLocaleString()} bonus points
                    </div>
                  )}
                  {rule.reward.monthlyMinSpend && (
                    <div>
                      <span className="font-medium">Minimum Spend:</span> 
                      ${rule.reward.monthlyMinSpend.toLocaleString()} per 
                      {rule.reward.monthlySpendPeriodType === 'statement_month' 
                        ? ' statement month' 
                        : ' calendar month'}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEditRule(rule)}>
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteRule(rule.id)}>
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
          </DialogHeader>
          <RewardRuleEditor
            rule={editingRule}
            onSave={handleSaveRule}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RewardRuleManager;
