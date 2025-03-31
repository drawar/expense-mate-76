import React, { useState, useEffect, useCallback } from 'react';
import { PaymentMethod, RewardRule } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CoinsIcon, TagIcon, Plus, Edit, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RewardRuleEditor } from '@/components/expense/cards/RewardRuleEditor';
import { cardRuleService, RuleConfiguration } from '@/components/expense/cards/CardRuleService';
import { getPaymentMethods, savePaymentMethods } from '@/utils/storageUtils';
import CategorySelector from './CategorySelector';

interface RewardRulesAdminProps {
  paymentMethod: PaymentMethod;
}

const RewardRulesAdmin: React.FC<RewardRulesAdminProps> = ({ paymentMethod }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    paymentMethod.selectedCategories || []
  );
  const [editingRule, setEditingRule] = useState<RewardRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [isLoading, setIsLoading] = useState(false);
  const [rules, setRules] = useState<RewardRule[]>(paymentMethod.rewardRules || []);
  const [editorConfig, setEditorConfig] = useState<any>(undefined);
  const { toast } = useToast();
  
  // Check if this is a UOB Lady's Solitaire card
  const isUOBLadysCard = paymentMethod.issuer === 'UOB' && paymentMethod.name === 'Lady\'s Solitaire';

  // Update local rules when paymentMethod changes
  useEffect(() => {
    setRules(paymentMethod.rewardRules || []);
    setSelectedCategories(paymentMethod.selectedCategories || []);
  }, [paymentMethod]);

  // Handler for when categories are changed by the CategorySelector
  const handleCategoriesChanged = useCallback((newCategories: string[]) => {
    console.log('Categories changed in CategorySelector:', newCategories);
    setSelectedCategories(newCategories);
    
    // Update paymentMethod with the new categories for use in calculations
    getPaymentMethods().then(methods => {
      const currentMethod = methods.find(m => m.id === paymentMethod.id);
      if (currentMethod) {
        console.log('Current saved categories:', currentMethod.selectedCategories);
      }
    });
  }, [paymentMethod.id]);

  // This effect runs when selectedCategories changes
  useEffect(() => {
    if (isUOBLadysCard) {
      console.log('selectedCategories state updated:', selectedCategories);
    }
  }, [selectedCategories, isUOBLadysCard]);

  // When editing rule changes, load the actual configuration
  useEffect(() => {
    const loadRuleConfig = async () => {
      if (editingRule) {
        // Load the actual saved configuration from CardRuleService
        try {
          setIsLoading(true);
          const config = await createInitialConfig(editingRule);
          setEditorConfig(config);
        } catch (error) {
          console.error('Error loading rule configuration:', error);
          // Fallback to defaults if there's an error
          setEditorConfig({
            name: editingRule.name,
            description: editingRule.description || '',
            enabled: true,
            basePointRate: 0.4,
            bonusPointRate: (editingRule.pointsMultiplier || 1) - 0.4,
            monthlyCap: editingRule.maxSpend || 0,
            rounding: paymentMethod.issuer === 'UOB' ? 'nearest5' : 
                      paymentMethod.issuer === 'Citibank' ? 'floor' : 'nearest',
            isOnlineOnly: editingRule.type === 'online',
            isContactlessOnly: editingRule.type === 'contactless',
            isForeignCurrency: editingRule.type === 'currency',
            includedMCCs: Array.isArray(editingRule.condition) ? editingRule.condition : [],
            excludedMCCs: []
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        // For adding new rules, use defaults
        setEditorConfig(undefined);
      }
    };
    
    loadRuleConfig();
  }, [editingRule, paymentMethod.issuer]);

  const handleAddRule = () => {
    setEditingRule(null);
    setEditorConfig(undefined);
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const handleEditRule = (rule: RewardRule) => {
    setEditingRule(rule);
    setDialogMode('edit');
    // Dialog opening is deferred until config is loaded
    setIsDialogOpen(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      setIsLoading(true);
      
      // Find card type in card registry
      const cardType = paymentMethod.issuer && paymentMethod.name ? 
        `${paymentMethod.issuer.toLowerCase()}-${paymentMethod.name.toLowerCase().replace(/\s+/g, '-')}` : 
        'generic';
      
      // Attempt to delete rule from CardRuleService
      if (ruleId) {
        await cardRuleService.deleteRule(ruleId);
      }
      
      // Update local state
      const updatedRules = rules.filter(r => r.id !== ruleId);
      setRules(updatedRules);
      
      // Update payment method
      const currentMethods = await getPaymentMethods();
      const updatedMethods = currentMethods.map(method => {
        if (method.id === paymentMethod.id) {
          return { ...method, rewardRules: updatedRules };
        }
        return method;
      });
      
      await savePaymentMethods(updatedMethods);
      
      toast({
        title: 'Rule Deleted',
        description: 'The reward rule has been removed.',
      });
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the reward rule.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRule = async (config: any) => {
    try {
      setIsLoading(true);
      
      // Convert to RuleConfiguration format
      const cardType = paymentMethod.issuer && paymentMethod.name ? 
        `${paymentMethod.issuer.toLowerCase()}-${paymentMethod.name.toLowerCase().replace(/\s+/g, '-')}` : 
        'generic';
      
      // Set currency restrictions based on isForeignCurrency flag
      let currencyRestrictions = config.currencyRestrictions;
      if (config.isForeignCurrency) {
        currencyRestrictions = ['!SGD']; // Exclude SGD transactions
      }
      
      // Create rule config
      const ruleConfig: RuleConfiguration = {
        id: editingRule?.id || uuidv4(),
        name: config.name,
        description: config.description || config.name,
        cardType,
        enabled: config.enabled,
        rounding: config.rounding, // Use user-selected rounding method
        basePointRate: config.basePointRate,
        bonusPointRate: config.bonusPointRate,
        monthlyCap: config.monthlyCap,
        isOnlineOnly: config.isOnlineOnly,
        isContactlessOnly: config.isContactlessOnly,
        includedMCCs: config.includedMCCs || [],
        excludedMCCs: config.excludedMCCs || [],
        minSpend: config.minSpend,
        maxSpend: config.maxSpend,
        currencyRestrictions: currencyRestrictions,
        pointsCurrency: paymentMethod.issuer ? `${paymentMethod.issuer} Points` : 'Points',
      };
      
      // Save to CardRuleService
      await cardRuleService.saveRule(ruleConfig);
      
      // Convert to RewardRule for UI
      const rewardRule: RewardRule = {
        id: ruleConfig.id,
        name: ruleConfig.name,
        description: ruleConfig.description,
        type: ruleConfig.isOnlineOnly ? 'online' : 
              ruleConfig.isContactlessOnly ? 'contactless' : 
              ruleConfig.currencyRestrictions?.includes('!SGD') ? 'currency' :
              ruleConfig.includedMCCs.length > 0 ? 'mcc' : 'merchant',
        condition: ruleConfig.includedMCCs.length > 0 ? ruleConfig.includedMCCs : '',
        pointsMultiplier: ruleConfig.basePointRate + ruleConfig.bonusPointRate,
        maxSpend: ruleConfig.monthlyCap,
        pointsCurrency: ruleConfig.pointsCurrency
      };
      
      // Update local state based on mode
      let updatedRules: RewardRule[];
      if (dialogMode === 'add') {
        updatedRules = [...rules, rewardRule];
      } else {
        updatedRules = rules.map(r => r.id === rewardRule.id ? rewardRule : r);
      }
      
      setRules(updatedRules);
      
      // Update payment method
      const currentMethods = await getPaymentMethods();
      const updatedMethods = currentMethods.map(method => {
        if (method.id === paymentMethod.id) {
          return { ...method, rewardRules: updatedRules };
        }
        return method;
      });
      
      await savePaymentMethods(updatedMethods);
      
      toast({
        title: dialogMode === 'add' ? 'Rule Added' : 'Rule Updated',
        description: `The reward rule has been ${dialogMode === 'add' ? 'added' : 'updated'}.`,
      });
      
      // Close dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: 'Error',
        description: `Failed to ${dialogMode === 'add' ? 'add' : 'update'} the reward rule.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create initial config from RewardRule with actual saved values
  const createInitialConfig = async (rule: RewardRule) => {
    console.log('Loading configuration for rule:', rule.id);
    
    // Default values in case we can't load the actual config
    let basePointRate = 0.4;
    let bonusPointRate = (rule.pointsMultiplier || 1) - 0.4;
    let rounding = paymentMethod.issuer === 'UOB' ? 'nearest5' : 
                  paymentMethod.issuer === 'Citibank' ? 'floor' : 'nearest';
    let currencyRestrictions: string[] = [];
    let isForeignCurrency = rule.type === 'currency';
    
    // Try to get the actual saved rule from CardRuleService
    if (rule.id) {
      try {
        const savedRule = await cardRuleService.getRule(rule.id);
        console.log('Loaded saved rule:', savedRule);
        
        if (savedRule) {
          // Use the actual saved values
          basePointRate = savedRule.basePointRate || basePointRate;
          bonusPointRate = savedRule.bonusPointRate || bonusPointRate;
          rounding = savedRule.rounding || rounding;
          currencyRestrictions = savedRule.currencyRestrictions || [];
          isForeignCurrency = currencyRestrictions.includes('!SGD') || rule.type === 'currency';
        }
      } catch (error) {
        console.error('Failed to load saved rule config:', error);
        // Continue with fallback values
      }
    }
    
    // Determine included MCCs from condition
    const includedMCCs = Array.isArray(rule.condition) ? rule.condition : [];
    
    return {
      name: rule.name,
      description: rule.description || '',
      enabled: true,
      basePointRate,
      bonusPointRate,
      monthlyCap: rule.maxSpend || 0,
      rounding,
      isOnlineOnly: rule.type === 'online',
      isContactlessOnly: rule.type === 'contactless',
      isForeignCurrency,
      includedMCCs,
      excludedMCCs: [],
      currencyRestrictions,
    };
  };

  // Empty state when no rules present (and not UOB Lady's card)
  if (!rules.length && !isUOBLadysCard) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No reward rules configured</AlertTitle>
          <AlertDescription>
            This card doesn't have any custom reward rules. Add rules to customize how points are calculated.
          </AlertDescription>
        </Alert>
        
        <div className="text-center py-8">
          <CoinsIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p>Create reward rules to customize how points are calculated.</p>
          <Button onClick={handleAddRule} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add First Rule
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <CoinsIcon className="h-5 w-5 text-amber-500" />
          Reward Rules
        </h3>
        <Button onClick={handleAddRule} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>
      
      {/* Category Selector for UOB Lady's card */}
      {isUOBLadysCard && (
        <div className="mb-4">
          <CategorySelector 
            paymentMethod={paymentMethod} 
            onCategoriesChanged={handleCategoriesChanged}
          />
        </div>
      )}
      
      {/* Rule list */}
      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <RuleCard 
            key={rule.id} 
            rule={rule} 
            onEdit={() => handleEditRule(rule)}
            onDelete={() => handleDeleteRule(rule.id)}
          />
        ))}
      </div>
      
      {/* Rule Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? 'Add New Reward Rule' : 'Edit Reward Rule'}
            </DialogTitle>
          </DialogHeader>
          
          {isLoading && dialogMode === 'edit' && !editorConfig ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading rule configuration...</p>
            </div>
          ) : (
            <RewardRuleEditor 
              initialConfig={editorConfig}
              onSave={handleSaveRule}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface RuleCardProps {
  rule: RewardRule;
  onEdit: () => void;
  onDelete: () => void;
}

const RuleCard: React.FC<RuleCardProps> = ({ rule, onEdit, onDelete }) => {
  // Format condition for display
  const formatCondition = (condition: string | string[]): React.ReactNode => {
    if (typeof condition === 'string') {
      return <span>{condition}</span>;
    }
    
    if (condition.length === 0) {
      return <span className="text-muted-foreground">No conditions</span>;
    }
    
    if (condition.length > 10) {
      // Show first few and count
      return (
        <div>
          <div className="flex flex-wrap gap-1 mb-2">
            {condition.slice(0, 10).map((item, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            + {condition.length - 10} more categories
          </p>
        </div>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {condition.map((item, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    );
  };

  // Get a descriptive label for rule type
  const getRuleTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mcc': return 'MCC Code';
      case 'merchant': return 'Merchant Name';
      case 'online': return 'Online Transaction';
      case 'contactless': return 'Contactless Payment';
      case 'currency': return 'Foreign Currency';
      default: return type.toUpperCase();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{rule.name}</CardTitle>
            <CardDescription>{rule.description}</CardDescription>
          </div>
          <Badge 
            className={cn(
              "px-2 py-0.5",
              rule.pointsMultiplier && rule.pointsMultiplier > 5 ? "bg-green-500" : "bg-blue-500"
            )}
          >
            {rule.pointsMultiplier}x
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium flex items-center gap-1 mb-1">
              <TagIcon className="h-3 w-3 mr-1" />
              Rule Type: {getRuleTypeLabel(rule.type)}
            </p>
            <div className="text-sm">{formatCondition(rule.condition)}</div>
          </div>
          
          {rule.maxSpend && (
            <div className="text-sm">
              <span className="font-medium">Monthly Cap:</span> {rule.maxSpend.toLocaleString()} points
            </div>
          )}
          
          {rule.pointsCurrency && (
            <div className="text-sm">
              <span className="font-medium">Points Currency:</span> {rule.pointsCurrency}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="py-2 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash className="h-3.5 w-3.5 mr-1.5" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RewardRulesAdmin;