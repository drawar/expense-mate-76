// components/rewards/RewardRuleEditor.tsx
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { 
  RewardRule, 
  RuleCondition, 
  BonusTier,
  CalculationMethod,
  RoundingStrategy,
  SpendingPeriodType
} from '@/services/rewards/types';
import { ConditionEditor } from './ConditionEditor';
import { BonusTierEditor } from './BonusTierEditor';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  
  // Initialize state with default or existing rule
  const [formData, setFormData] = useState<RewardRule>(() => {
    if (rule) {
      return { ...rule };
    }
    
    // Default rule template
    return {
      id: uuidv4(),
      cardTypeId,
      name: '',
      description: '',
      enabled: true,
      priority: 10,
      conditions: [],
      reward: {
        calculationMethod: 'standard',
        baseMultiplier: 0.2,
        bonusMultiplier: 1.8,
        pointsRoundingStrategy: 'floor',
        amountRoundingStrategy: 'floor5',
        blockSize: 5,
        pointsCurrency: 'Points'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
  
  // Handle adding a root-level condition
  const handleAddCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          type: 'mcc',
          operation: 'include',
          values: []
        }
      ]
    }));
  };
  
  // Handle removing a root-level condition
  const handleRemoveCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };
  
  // Handle updating a root-level condition
  const handleUpdateCondition = (index: number, condition: RuleCondition) => {
    setFormData(prev => {
      const newConditions = [...prev.conditions];
      newConditions[index] = condition;
      return {
        ...prev,
        conditions: newConditions
      };
    });
  };
  
  // Handle adding a new bonus tier
  const handleAddBonusTier = () => {
    const newTier: BonusTier = {
      name: `New Tier ${(formData.reward.bonusTiers?.length || 0) + 1}`,
      multiplier: formData.reward.bonusMultiplier,
      priority: 1,
      condition: {
        type: 'mcc',
        operation: 'include',
        values: []
      }
    };
    
    setFormData(prev => ({
      ...prev,
      reward: {
        ...prev.reward,
        bonusTiers: [...(prev.reward.bonusTiers || []), newTier]
      }
    }));
  };
  
  // Handle removing a bonus tier
  const handleRemoveBonusTier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reward: {
        ...prev.reward,
        bonusTiers: prev.reward.bonusTiers?.filter((_, i) => i !== index)
      }
    }));
  };
  
  // Handle updating a bonus tier
  const handleUpdateBonusTier = (index: number, tier: BonusTier) => {
    setFormData(prev => {
      if (!prev.reward.bonusTiers) return prev;
      
      const newTiers = [...prev.reward.bonusTiers];
      newTiers[index] = tier;
      
      return {
        ...prev,
        reward: {
          ...prev.reward,
          bonusTiers: newTiers
        }
      };
    });
  };
  
  // Input change handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle reward setting changes
  const handleRewardChange = (field: keyof RewardRule['reward'], value: any) => {
    setFormData(prev => ({
      ...prev,
      reward: {
        ...prev.reward,
        [field]: value
      }
    }));
  };
  
  // Handle boolean switches
  const handleSwitchChange = (name: 'enabled', checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Rule name is required",
        variant: "destructive"
      });
      return;
    }
    
    // Update timestamps
    const updatedRule: RewardRule = {
      ...formData,
      updatedAt: new Date()
    };
    
    onSave(updatedRule);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="reward">Reward</TabsTrigger>
          <TabsTrigger value="tiers">Bonus Tiers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="E.g., Online Bonus Points"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="E.g., 10X points on online transactions"
            />
          </div>
          
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              name="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                priority: parseInt(e.target.value) 
              }))}
              placeholder="Higher values have higher priority"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Rules with higher priority will be applied first
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => handleSwitchChange('enabled', checked)}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>
        </TabsContent>
        
        <TabsContent value="conditions" className="space-y-4">
          <div className="space-y-3">
            {formData.conditions.length > 0 ? (
              <div className="space-y-3">
                {formData.conditions.map((condition, index) => (
                  <ConditionEditor
                    key={index}
                    condition={condition}
                    onChange={(newCondition) => handleUpdateCondition(index, newCondition)}
                    onDelete={() => handleRemoveCondition(index)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-4 border border-dashed rounded-md">
                <p className="text-sm text-gray-500">
                  No conditions added yet. Add conditions to define when this rule applies.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  If no conditions are specified, the rule will apply to all transactions.
                </p>
              </div>
            )}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCondition}
              className="w-full"
            >
              <PlusCircle size={16} className="mr-2" />
              Add Condition
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="reward" className="space-y-4">
          {/* Calculation Method */}
          <div>
            <Label htmlFor="calculationMethod">Calculation Method</Label>
            <Select
              value={formData.reward.calculationMethod}
              onValueChange={(value: CalculationMethod) => 
                handleRewardChange('calculationMethod', value)
              }
            >
              <SelectTrigger id="calculationMethod">
                <SelectValue placeholder="Select calculation method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (Round amount first, then calculate)</SelectItem>
                <SelectItem value="direct">Direct (Calculate first, then round)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Standard: Round amount → Divide by block size → Multiply by rate<br />
              Direct: Multiply amount by rate → Round result
            </p>
          </div>
          
          {/* Block Size */}
          <div>
            <Label htmlFor="blockSize">Block Size</Label>
            <Select
              value={formData.reward.blockSize.toString()}
              onValueChange={(value) => 
                handleRewardChange('blockSize', parseInt(value))
              }
            >
              <SelectTrigger id="blockSize">
                <SelectValue placeholder="Select block size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">$1 (Points per dollar)</SelectItem>
                <SelectItem value="5">$5 (Points per $5 block)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              For cards like UOB/OCBC that use $5 blocks, or $1 for direct point calculations
            </p>
          </div>
          
          {/* Bonus Multiplier */}
          <div>
            <Label htmlFor="bonusMultiplier">Bonus Multiplier</Label>
            <Input
              id="bonusMultiplier"
              type="number"
              step="0.1"
              value={formData.reward.bonusMultiplier}
              onChange={(e) => 
                handleRewardChange('bonusMultiplier', parseFloat(e.target.value))
              }
              placeholder="Bonus points per dollar or per block"
            />
            <p className="text-xs text-gray-500 mt-1">
              E.g., 1.8 = 9 points per $5 with block size of 5 (after 1 base point)
            </p>
          </div>
          
          {/* Monthly Cap */}
          <div>
            <Label htmlFor="monthlyCap">Monthly Bonus Points Cap</Label>
            <Input
              id="monthlyCap"
              type="number"
              value={formData.reward.monthlyCap || ''}
              onChange={(e) => 
                handleRewardChange('monthlyCap', e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="Leave empty for no cap"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum bonus points that can be earned per month
            </p>
          </div>
          
          {/* Minimum Monthly Spend */}
          <div>
            <Label htmlFor="monthlyMinSpend">Minimum Monthly Spend</Label>
            <Input
              id="monthlyMinSpend"
              type="number"
              value={formData.reward.monthlyMinSpend || ''}
              onChange={(e) => 
                handleRewardChange('monthlyMinSpend', e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="Leave empty for no minimum"
            />
          </div>
          
          {/* Monthly Spend Period Type */}
          {formData.reward.monthlyMinSpend && (
            <div>
              <Label htmlFor="monthlySpendPeriodType">Spending Period Type</Label>
              <Select
                value={formData.reward.monthlySpendPeriodType || 'calendar_month'}
                onValueChange={(value: SpendingPeriodType) => 
                  handleRewardChange('monthlySpendPeriodType', value)
                }
              >
                <SelectTrigger id="monthlySpendPeriodType">
                  <SelectValue placeholder="Select period type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendar_month">Calendar Month</SelectItem>
                  <SelectItem value="statement_month">Statement Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Amount Rounding Strategy */}
          <div>
            <Label htmlFor="amountRoundingStrategy">Amount Rounding Strategy</Label>
            <Select
              value={formData.reward.amountRoundingStrategy}
              onValueChange={(value: RoundingStrategy) => 
                handleRewardChange('amountRoundingStrategy', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rounding strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="floor">Round Down (Floor)</SelectItem>
                <SelectItem value="ceiling">Round Up (Ceiling)</SelectItem>
                <SelectItem value="nearest">Round to Nearest</SelectItem>
                <SelectItem value="floor5">Round Down to Nearest $5</SelectItem>
                <SelectItem value="none">No Rounding</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Points Rounding Strategy */}
          <div>
            <Label htmlFor="pointsRoundingStrategy">Points Rounding Strategy</Label>
            <Select
              value={formData.reward.pointsRoundingStrategy}
              onValueChange={(value: RoundingStrategy) => 
                handleRewardChange('pointsRoundingStrategy', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rounding strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="floor">Round Down (Floor)</SelectItem>
                <SelectItem value="ceiling">Round Up (Ceiling)</SelectItem>
                <SelectItem value="nearest">Round to Nearest</SelectItem>
                <SelectItem value="floor5">Round Down to Nearest $5</SelectItem>
                <SelectItem value="none">No Rounding</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Points Currency */}
          <div>
            <Label htmlFor="pointsCurrency">Points Currency</Label>
            <Input
              id="pointsCurrency"
              value={formData.reward.pointsCurrency}
              onChange={(e) => 
                handleRewardChange('pointsCurrency', e.target.value)
              }
              placeholder="E.g., UNI$, ThankYou Points, DBS Points"
            />
          </div>
          
          {/* Preview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Rate Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {(formData.reward.baseMultiplier + formData.reward.bonusMultiplier).toFixed(1)}x
                </div>
                <div className="text-sm text-muted-foreground">
                  Base: {formData.reward.baseMultiplier.toFixed(1)}x + 
                  Bonus: {formData.reward.bonusMultiplier.toFixed(1)}x
                </div>
                {formData.reward.blockSize > 1 && (
                  <div className="text-sm text-muted-foreground">
                    Per ${formData.reward.blockSize} block
                  </div>
                )}
                {formData.reward.monthlyCap && (
                  <div className="text-sm text-muted-foreground">
                    Monthly cap: {formData.reward.monthlyCap.toLocaleString()} bonus points
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  );
};

export default RewardRuleEditor;
