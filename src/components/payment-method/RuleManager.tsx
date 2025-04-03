
import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { Rule, ruleService } from '@/services/RuleService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash, CoinsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RuleEditor from './RuleEditor';

interface RuleManagerProps {
  paymentMethod: PaymentMethod;
}

const RuleManager: React.FC<RuleManagerProps> = ({ paymentMethod }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Generate a standardized card type key
  const getCardTypeKey = (paymentMethod: PaymentMethod): string => {
    if (paymentMethod.type !== 'credit_card' || !paymentMethod.issuer || !paymentMethod.name) {
      return 'generic';
    }
    
    return `${paymentMethod.issuer.toLowerCase()}-${paymentMethod.name.toLowerCase().replace(/\s+/g, '-')}`;
  };
  
  const cardType = getCardTypeKey(paymentMethod);
  
  // Load rules for this card type
  useEffect(() => {
    const loadRules = async () => {
      setIsLoading(true);
      try {
        await ruleService.loadRules();
        const cardRules = ruleService.getRulesForCardType(cardType);
        setRules(cardRules);
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
  }, [cardType, toast]);
  
  // Handle adding a new rule
  const handleAddRule = () => {
    setEditingRule(undefined);
    setIsEditorOpen(true);
  };
  
  // Handle editing an existing rule
  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };
  
  // Handle deleting a rule
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    setIsLoading(true);
    try {
      const success = await ruleService.deleteRule(ruleId);
      if (success) {
        setRules(rules.filter(rule => rule.id !== ruleId));
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
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle saving a rule
  const handleSaveRule = async (ruleData: any) => {
    setIsLoading(true);
    try {
      if (editingRule) {
        // Update existing rule
        const updatedRule = await ruleService.updateRule(editingRule.id, ruleData);
        if (updatedRule) {
          setRules(rules.map(rule => rule.id === updatedRule.id ? updatedRule : rule));
          toast({
            title: 'Success',
            description: 'Rule updated successfully',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to update rule',
            variant: 'destructive',
          });
        }
      } else {
        // Create new rule
        const newRule = await ruleService.createRule(ruleData);
        if (newRule) {
          setRules([...rules, newRule]);
          toast({
            title: 'Success',
            description: 'Rule created successfully',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create rule',
            variant: 'destructive',
          });
        }
      }
      setIsEditorOpen(false);
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rule',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format condition for display
  const formatCondition = (rule: Rule): string => {
    const { condition } = rule;
    
    if (condition.isOnlineOnly) {
      return 'Online transactions';
    }
    
    if (condition.isContactlessOnly) {
      return 'Contactless payments';
    }
    
    if (condition.foreignCurrencyOnly) {
      return 'Foreign currency transactions';
    }
    
    if (condition.merchantNames && condition.merchantNames.length > 0) {
      if (condition.merchantNames.length === 1) {
        return `Merchant: ${condition.merchantNames[0]}`;
      }
      return `${condition.merchantNames.length} merchants`;
    }
    
    if (condition.mccCodes && condition.mccCodes.length > 0) {
      if (condition.mccCodes.length === 1) {
        return `MCC: ${condition.mccCodes[0]}`;
      }
      return `${condition.mccCodes.length} MCC codes`;
    }
    
    return 'All transactions';
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CoinsIcon className="h-6 w-6" />
          Reward Rules
        </h2>
        <Button onClick={handleAddRule} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>
      
      {isLoading && rules.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CoinsIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No reward rules configured for this payment method.</p>
            <Button onClick={handleAddRule} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map(rule => (
            <Card key={rule.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{rule.name}</CardTitle>
                    <CardDescription>{rule.description || formatCondition(rule)}</CardDescription>
                  </div>
                  <Badge>
                    {(rule.reward.basePointRate + rule.reward.bonusPointRate).toFixed(1)}x
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-gray-500">{formatCondition(rule)}</p>
                <div className="text-sm mt-2">
                  <span className="font-medium">Base Rate:</span> {rule.reward.basePointRate.toFixed(2)}x
                  {rule.reward.bonusPointRate > 0 && (
                    <span> + Bonus: {rule.reward.bonusPointRate.toFixed(2)}x</span>
                  )}
                  {rule.reward.monthlyCap && (
                    <div className="mt-1">
                      <span className="font-medium">Monthly Cap:</span> {rule.reward.monthlyCap.toLocaleString()} points
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEditRule(rule)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Rule editor dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
          </DialogHeader>
          <RuleEditor
            rule={editingRule}
            cardType={cardType}
            onSave={handleSaveRule}
            onCancel={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RuleManager;
