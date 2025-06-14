
import React, { useState, useEffect } from 'react';
import { RewardRule } from '@/core/rewards/types';
import { RuleRepository } from '@/core/rewards/RuleRepository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { RewardRuleEditor } from './RewardRuleEditor';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

interface RewardRuleManagerProps {
  cardTypeId: string;
}

export const RewardRuleManager: React.FC<RewardRuleManagerProps> = ({ cardTypeId }) => {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<RewardRule | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const ruleRepository = RuleRepository.getInstance();

  useEffect(() => {
    loadRules();
  }, [cardTypeId]);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const loadedRules = await ruleRepository.getRulesForCardType(cardTypeId);
      setRules(loadedRules);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedRule(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (rule: RewardRule) => {
    setSelectedRule(rule);
    setIsEditorOpen(true);
  };

  const handleSave = async (rule: RewardRule) => {
    try {
      if (rule.id) {
        await ruleRepository.updateRule(rule);
      } else {
        await ruleRepository.createRule({ ...rule, cardTypeId });
      }
      await loadRules();
      setIsEditorOpen(false);
      setSelectedRule(null);
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      try {
        await ruleRepository.deleteRule(ruleId);
        await loadRules();
      } catch (error) {
        console.error('Error deleting rule:', error);
      }
    }
  };

  if (isLoading) {
    return <div>Loading rules...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Reward Rules</h3>
        <Button onClick={handleCreateNew}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No reward rules configured.</p>
            <Button onClick={handleCreateNew} className="mt-4">
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{rule.name}</CardTitle>
                    {rule.description && (
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {rule.reward.baseMultiplier + rule.reward.bonusMultiplier}x Points
                  </span>
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                    {rule.conditions.length} condition(s)
                  </span>
                  {rule.reward.monthlyCap && (
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      Cap: {rule.reward.monthlyCap.toLocaleString()}
                    </span>
                  )}
                  {!rule.enabled && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Disabled
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Edit Reward Rule' : 'Create New Reward Rule'}
            </DialogTitle>
          </DialogHeader>
          
          <RewardRuleEditor
            rule={selectedRule}
            cardTypeId={cardTypeId}
            onSave={handleSave}
            onCancel={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RewardRuleManager;
