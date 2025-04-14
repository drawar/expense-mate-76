// components/rewards/ConditionEditor.tsx
import React, { useState } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, Trash, ChevronDown, ChevronRight } from 'lucide-react';
import { RuleCondition, TransactionType } from '@/core/rewards/types';

interface ConditionEditorProps {
  condition: RuleCondition;
  onChange: (condition: RuleCondition) => void;
  onDelete?: () => void;
  isNested?: boolean;
}

export const ConditionEditor: React.FC<ConditionEditorProps> = ({
  condition,
  onChange,
  onDelete,
  isNested = false
}) => {
  const [expanded, setExpanded] = useState(!isNested);
  const [newValue, setNewValue] = useState('');

  const handleTypeChange = (type: string) => {
    let newCondition: RuleCondition;
    if (type === 'compound') {
      newCondition = {
        type: 'compound',
        operation: 'all',
        subConditions: []
      };
    } else {
      newCondition = {
        type: type as any,
        operation: 'equals',
        values: []
      };
    }
    onChange(newCondition);
  };

  const handleOperationChange = (operation: string) => {
    onChange({
      ...condition,
      operation: operation as any
    });
  };

  const handleAddValue = () => {
    if (!newValue.trim()) return;
  
    if (
      condition.type === 'mcc' || 
      condition.type === 'currency' || 
      condition.type === 'merchant' || 
      condition.type === 'category'
    ) {
      const newValues = [...(condition.values as string[] || [])];
      newValues.push(newValue);
      onChange({
        ...condition,
        values: newValues
      });
  
    } else if (
      condition.type === 'amount' || 
      condition.type === 'spend_threshold'
    ) {
      const parsed = parseFloat(newValue);
      if (isNaN(parsed)) return;
      const newValues = [...(condition.values as number[] || [])];
      newValues.push(parsed);
      onChange({
        ...condition,
        values: newValues
      });
  
    } else if (condition.type === 'transaction_type') {
      const newValues = [...(condition.values as TransactionType[] || [])];
      newValues.push(newValue as TransactionType);
      onChange({
        ...condition,
        values: newValues
      });
    }
  
    setNewValue('');
  };  

  const handleRemoveValue = (index: number) => {
    if (!condition.values) return;
  
    let newValues;
  
    if (
      condition.type === 'mcc' || 
      condition.type === 'currency' || 
      condition.type === 'merchant' || 
      condition.type === 'category'
    ) {
      newValues = [...(condition.values as string[])];
    } else if (
      condition.type === 'amount' || 
      condition.type === 'spend_threshold'
    ) {
      newValues = [...(condition.values as number[])];
    } else if (condition.type === 'transaction_type') {
      newValues = [...(condition.values as TransactionType[])];
    } else {
      return; // unexpected type
    }
  
    newValues.splice(index, 1);
  
    onChange({
      ...condition,
      values: newValues
    });
  };
  
  const handleSubConditionChange = (index: number, subCondition: RuleCondition) => {
    if (!condition.subConditions) return;

    const newSubConditions = [...condition.subConditions];
    newSubConditions[index] = subCondition;

    onChange({
      ...condition,
      subConditions: newSubConditions
    });
  };

  const handleAddSubCondition = () => {
    if (condition.type !== 'compound') return;

    const newSubConditions = [...(condition.subConditions || [])];

    newSubConditions.push({
      type: 'mcc',
      operation: 'include',
      values: []
    });

    onChange({
      ...condition,
      subConditions: newSubConditions
    });
  };

  const handleRemoveSubCondition = (index: number) => {
    if (!condition.subConditions) return;

    const newSubConditions = [...condition.subConditions];
    newSubConditions.splice(index, 1);

    onChange({
      ...condition,
      subConditions: newSubConditions
    });
  };

  return (
    <Card className={isNested ? "border-dashed border-gray-300 mt-2" : ""}>
      <CardHeader className="p-3 flex flex-row items-center justify-between">
        <div className="flex items-center">
          {isNested && (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="p-0 h-6 w-6 mr-2"
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </Button>
          )}
          <CardTitle className="text-sm">
            {condition.type === 'compound' 
              ? `Group (${condition.operation === 'all' ? 'AND' : 'OR'})` 
              : condition.type.toUpperCase()}
          </CardTitle>
        </div>
        
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="p-1 h-7 w-7"
          >
            <Trash size={14} />
          </Button>
        )}
      </CardHeader>
      
      {(expanded || !isNested) && (
        <CardContent className="p-3 pt-0">
          <div className="space-y-3">
            {/* Condition Type */}
            <div>
              <Label htmlFor="conditionType" className="text-xs">Condition Type</Label>
              <Select
                value={condition.type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger id="conditionType" className="h-8">
                  <SelectValue placeholder="Select condition type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcc">MCC Code</SelectItem>
                  <SelectItem value="merchant">Merchant Name</SelectItem>
                  <SelectItem value="transaction_type">Transaction Type</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="spend_threshold">Spend Threshold</SelectItem>
                  <SelectItem value="compound">Compound (Group)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Operation Selection */}
            {condition.type !== 'compound' ? (
              <div>
                <Label htmlFor="operation" className="text-xs">Operation</Label>
                <Select
                  value={condition.operation}
                  onValueChange={handleOperationChange}
                >
                  <SelectTrigger id="operation" className="h-8">
                    <SelectValue placeholder="Select operation" />
                  </SelectTrigger>
                  <SelectContent>
                    {condition.type === 'mcc' || condition.type === 'currency' || 
                    condition.type === 'category' || condition.type === 'merchant' ? (
                      <>
                        <SelectItem value="include">Include</SelectItem>
                        <SelectItem value="exclude">Exclude</SelectItem>
                        <SelectItem value="equals">Equals</SelectItem>
                      </>
                    ) : condition.type === 'amount' || condition.type === 'spend_threshold' ? (
                      <>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="between">Between</SelectItem>
                      </>
                    ) : condition.type === 'transaction_type' ? (
                      <>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                      </>
                    ) : (
                      <SelectItem value="equals">Equals</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="compoundOperation" className="text-xs">Logic</Label>
                <RadioGroup
                  value={condition.operation}
                  onValueChange={handleOperationChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="text-xs">AND (All conditions must match)</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="any" id="any" />
                    <Label htmlFor="any" className="text-xs">OR (Any condition can match)</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            {/* Value Input (for non-compound conditions) */}
            {condition.type !== 'compound' && (
              <div>
                <Label htmlFor="conditionValue" className="text-xs">
                  {condition.type === 'transaction_type' ? 'Transaction Type' : 'Value'}
                </Label>
                
                {condition.type === 'transaction_type' ? (
                  <Select
                    value={newValue}
                    onValueChange={setNewValue}
                  >
                    <SelectTrigger id="transactionType" className="h-8">
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.ONLINE}>Online</SelectItem>
                      <SelectItem value={TransactionType.CONTACTLESS}>Contactless</SelectItem>
                      <SelectItem value={TransactionType.IN_STORE}>In-Store</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex space-x-2">
                    <Input
                      id="conditionValue"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={condition.type === 'amount' ? 'Enter amount' : 
                                  condition.type === 'mcc' ? 'Enter MCC code' :
                                  condition.type === 'merchant' ? 'Enter merchant name' :
                                  condition.type === 'currency' ? 'Enter currency code' :
                                  condition.type === 'category' ? 'Enter category' :
                                  'Enter value'}
                      className="h-8"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddValue}
                      className="h-8"
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Values Display */}
            {condition.type !== 'compound' && condition.values && condition.values.length > 0 && (
              <div>
                <Label className="text-xs">Current Values</Label>
                <div className="flex flex-wrap gap-1 p-2 border rounded-md">
                  {condition.values.map((value, index) => (
                    <div
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center"
                    >
                      <span className="text-xs">
                        {condition.type === 'transaction_type' 
                          ? (value === TransactionType.ONLINE 
                              ? 'Online' 
                              : value === TransactionType.CONTACTLESS 
                                ? 'Contactless' 
                                : 'In-Store')
                          : value.toString()}
                      </span>
                      <button
                        type="button"
                        className="ml-1 text-blue-600 hover:text-blue-800"
                        onClick={() => handleRemoveValue(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Sub-conditions (for compound conditions) */}
            {condition.type === 'compound' && (
              <div className="space-y-2">
                {condition.subConditions && condition.subConditions.length > 0 ? (
                  <div className="space-y-2">
                    {condition.subConditions.map((subCondition, index) => (
                      <ConditionEditor
                        key={index}
                        condition={subCondition}
                        onChange={(newSubCondition) => handleSubConditionChange(index, newSubCondition)}
                        onDelete={() => handleRemoveSubCondition(index)}
                        isNested={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-2 border border-dashed rounded-md">
                    <p className="text-xs text-gray-500">No conditions added yet</p>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubCondition}
                  className="w-full"
                >
                  <PlusCircle size={14} className="mr-2" />
                  Add Condition
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
