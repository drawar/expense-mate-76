
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircleIcon, EditIcon, TrashIcon, BadgeAlertIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CardRegistry } from '../expense/cards/CardRegistry';
import { RewardRuleEditor } from '../expense/cards/RewardRuleEditor';
import { 
  cardRuleService, 
  RuleConfiguration 
} from '../expense/cards/CardRuleService';
import { v4 as uuidv4 } from 'uuid';
import { PaymentMethod } from '@/types';

interface RewardRulesAdminProps {
  paymentMethod: PaymentMethod;
}

// Map RuleConfiguration to EditableRuleConfig
interface EditableRuleConfig {
  name: string;
  description: string;
  enabled: boolean;
  basePointRate: number;
  bonusPointRate: number;
  monthlyCap: number;
  isOnlineOnly: boolean;
  isContactlessOnly: boolean;
  includedMCCs: string[];
  excludedMCCs: string[];
  minSpend?: number; 
  maxSpend?: number;
  currencyRestrictions?: string[];
  pointsCurrency?: string;
}

const RewardRulesAdmin: React.FC<RewardRulesAdminProps> = ({ paymentMethod }) => {
  const [rules, setRules] = useState<RuleConfiguration[]>([]);
  const [editingRule, setEditingRule] = useState<RuleConfiguration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Find the corresponding card type in CardRegistry
  const cardInfo = CardRegistry.findCard(
    paymentMethod.issuer || '', 
    paymentMethod.name
  );
  
  const cardType = cardInfo?.id || `${paymentMethod.issuer}-${paymentMethod.name}`.toLowerCase();
  
  useEffect(() => {
    const loadRules = async () => {
      try {
        await cardRuleService.loadRules();
        const cardRules = cardRuleService.getRulesForCardType(cardType);
        setRules(cardRules);
      } catch (error) {
        console.error('Error loading reward rules:', error);
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
  
  const handleAddRule = () => {
    // Create a new rule with default values
    const newRule: RuleConfiguration = {
      id: uuidv4(),
      name: `New Rule for ${paymentMethod.name}`,
      description: 'Configure this rule for your card',
      cardType: cardType,
      enabled: true,
      rounding: 'floor',
      basePointRate: 0.4,
      bonusPointRate: 0,
      monthlyCap: 0,
      isOnlineOnly: false,
      isContactlessOnly: false,
      includedMCCs: [],
      excludedMCCs: [],
      pointsCurrency: cardInfo?.pointsCurrency || 'Points'
    };
    
    setEditingRule(newRule);
    setIsModalOpen(true);
  };
  
  const handleEditRule = (rule: RuleConfiguration) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };
  
  const handleDeleteRule = async (ruleId: string) => {
    try {
      const success = await cardRuleService.deleteRule(ruleId);
      
      if (success) {
        setRules(rules.filter(rule => rule.id !== ruleId));
        toast({
          title: 'Success',
          description: 'Reward rule deleted successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete reward rule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting reward rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete reward rule',
        variant: 'destructive',
      });
    }
  };
  
  const handleSaveRule = async (editableConfig: EditableRuleConfig) => {
    if (!editingRule) return;
    
    const updatedRule: RuleConfiguration = {
      ...editingRule,
      name: editableConfig.name,
      description: editableConfig.description,
      enabled: editableConfig.enabled,
      basePointRate: editableConfig.basePointRate,
      bonusPointRate: editableConfig.bonusPointRate,
      monthlyCap: editableConfig.monthlyCap,
      isOnlineOnly: editableConfig.isOnlineOnly,
      isContactlessOnly: editableConfig.isContactlessOnly,
      includedMCCs: editableConfig.includedMCCs,
      excludedMCCs: editableConfig.excludedMCCs,
      minSpend: editableConfig.minSpend,
      maxSpend: editableConfig.maxSpend,
      currencyRestrictions: editableConfig.currencyRestrictions,
      pointsCurrency: editableConfig.pointsCurrency || cardInfo?.pointsCurrency || 'Points',
    };
    
    // First validate the rule
    const validationErrors = cardRuleService.validateRule(updatedRule);
    
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors.join('. '),
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const success = await cardRuleService.saveRule(updatedRule);
      
      if (success) {
        // Update local state
        const updatedRules = [...rules.filter(r => r.id !== updatedRule.id), updatedRule];
        setRules(updatedRules);
        
        toast({
          title: 'Success',
          description: 'Reward rule saved successfully',
        });
        
        // Close modal
        setIsModalOpen(false);
        setEditingRule(null);
      } else {
        toast({
          title: 'Warning',
          description: 'Rule saved locally but failed to save to database',
          variant: 'default',
        });
        
        // Still update local state
        const updatedRules = [...rules.filter(r => r.id !== updatedRule.id), updatedRule];
        setRules(updatedRules);
        
        // Close modal
        setIsModalOpen(false);
        setEditingRule(null);
      }
    } catch (error) {
      console.error('Error saving reward rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save reward rule',
        variant: 'destructive',
      });
    }
  };
  
  // Convert RuleConfiguration to EditableRuleConfig for the editor
  const convertToEditableConfig = (rule: RuleConfiguration): EditableRuleConfig => {
    return {
      name: rule.name,
      description: rule.description || '',
      enabled: rule.enabled,
      basePointRate: rule.basePointRate,
      bonusPointRate: rule.bonusPointRate,
      monthlyCap: rule.monthlyCap,
      isOnlineOnly: rule.isOnlineOnly || false,
      isContactlessOnly: rule.isContactlessOnly || false,
      includedMCCs: rule.includedMCCs || [],
      excludedMCCs: rule.excludedMCCs || [],
      minSpend: rule.minSpend,
      maxSpend: rule.maxSpend,
      currencyRestrictions: rule.currencyRestrictions,
      pointsCurrency: rule.pointsCurrency
    };
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reward Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading reward rules...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {cardInfo?.pointsCurrency || 'Points'} Reward Rules
        </CardTitle>
        <Button onClick={handleAddRule} variant="outline" size="sm">
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-4 border rounded-md bg-gray-50 dark:bg-gray-900">
            <BadgeAlertIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500">No reward rules configured for this card.</p>
            <Button onClick={handleAddRule} variant="outline" size="sm" className="mt-2">
              Add Your First Rule
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div 
                key={rule.id} 
                className="p-3 border rounded-md flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div>
                  <h4 className="font-medium">{rule.name}</h4>
                  <p className="text-sm text-gray-500">{rule.description}</p>
                  {rule.isOnlineOnly && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full mt-1 inline-block mr-1">
                      Online Only
                    </span>
                  )}
                  {rule.isContactlessOnly && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full mt-1 inline-block mr-1">
                      Contactless Only
                    </span>
                  )}
                  {rule.includedMCCs?.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full mt-1 inline-block">
                      {rule.includedMCCs.length} MCCs
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEditRule(rule)}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Rule Editor Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Reward Rule' : 'Add Reward Rule'}
              </DialogTitle>
            </DialogHeader>
            
            {editingRule && (
              <RewardRuleEditor
                initialConfig={convertToEditableConfig(editingRule)}
                onSave={handleSaveRule}
                onCancel={() => {
                  setIsModalOpen(false);
                  setEditingRule(null);
                }}
              />
            )}
            
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRule(null);
                }}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RewardRulesAdmin;
