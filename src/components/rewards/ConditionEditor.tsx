
import React, { useState } from 'react';
import { RuleCondition, TransactionTypeValues } from '@/core/rewards/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConditionEditorProps {
  condition: RuleCondition;
  onChange: (condition: RuleCondition) => void;
}

export const ConditionEditor: React.FC<ConditionEditorProps> = ({ condition, onChange }) => {
  const handleTypeChange = (type: string) => {
    onChange({
      ...condition,
      type: type as any,
      values: [] // Reset values when type changes
    });
  };

  const handleOperationChange = (operation: string) => {
    onChange({
      ...condition,
      operation: operation as any
    });
  };

  const handleValuesChange = (values: (string | number)[]) => {
    onChange({
      ...condition,
      values: values
    });
  };

  const renderValueInput = () => {
    switch (condition.type) {
      case 'mcc':
        return (
          <div>
            <Label>MCC Codes</Label>
            <Input
              placeholder="e.g., 5411,5541,5812"
              value={(condition.values as string[])?.join(',') || ''}
              onChange={(e) => handleValuesChange(e.target.value.split(',').filter(Boolean))}
            />
          </div>
        );

      case 'merchant':
        return (
          <div>
            <Label>Merchant Names</Label>
            <Input
              placeholder="e.g., Starbucks,McDonald's"
              value={(condition.values as string[])?.join(',') || ''}
              onChange={(e) => handleValuesChange(e.target.value.split(',').filter(Boolean))}
            />
          </div>
        );

      case 'transaction_type':
        return (
          <div>
            <Label>Transaction Types</Label>
            <Select
              value={(condition.values as string[])?.[0] || ''}
              onValueChange={(value) => handleValuesChange([value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TransactionTypeValues.purchase}>Purchase</SelectItem>
                <SelectItem value={TransactionTypeValues.online}>Online</SelectItem>
                <SelectItem value={TransactionTypeValues.contactless}>Contactless</SelectItem>
                <SelectItem value={TransactionTypeValues.in_store}>In-store</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'currency':
        return (
          <div>
            <Label>Currencies</Label>
            <Input
              placeholder="e.g., USD,EUR,GBP"
              value={(condition.values as string[])?.join(',') || ''}
              onChange={(e) => handleValuesChange(e.target.value.split(',').filter(Boolean))}
            />
          </div>
        );

      case 'amount':
        return (
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={(condition.values as number[])?.[0]?.toString() || ''}
              onChange={(e) => handleValuesChange([parseFloat(e.target.value) || 0])}
            />
          </div>
        );

      default:
        return (
          <div>
            <Label>Values</Label>
            <Input
              placeholder="Enter values separated by commas"
              value={(condition.values as string[])?.join(',') || ''}
              onChange={(e) => handleValuesChange(e.target.value.split(',').filter(Boolean))}
            />
          </div>
        );
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 pt-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Condition Type</Label>
            <Select value={condition.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mcc">MCC Code</SelectItem>
                <SelectItem value="merchant">Merchant</SelectItem>
                <SelectItem value="transaction_type">Transaction Type</SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Operation</Label>
            <Select value={condition.operation} onValueChange={handleOperationChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="include">Include</SelectItem>
                <SelectItem value="exclude">Exclude</SelectItem>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="greater_than">Greater Than</SelectItem>
                <SelectItem value="less_than">Less Than</SelectItem>
                <SelectItem value="range">Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {renderValueInput()}
      </CardContent>
    </Card>
  );
};

export default ConditionEditor;
