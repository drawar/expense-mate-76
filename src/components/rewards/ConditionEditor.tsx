import { useState } from "react";
import { RuleCondition, TransactionTypeValues } from "@/core/rewards/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface ConditionEditorProps {
  condition: RuleCondition;
  onChange: (condition: RuleCondition) => void;
}

export const ConditionEditor: React.FC<ConditionEditorProps> = ({
  condition,
  onChange,
}) => {
  const handleTypeChange = (type: string) => {
    onChange({
      ...condition,
      type: type as RuleCondition["type"],
      values: [], // Reset values when type changes
    });
  };

  const handleOperationChange = (operation: string) => {
    onChange({
      ...condition,
      operation: operation as RuleCondition["operation"],
    });
  };

  const handleValuesChange = (values: (string | number)[]) => {
    onChange({
      ...condition,
      values: values,
    });
  };

  const renderValueInput = () => {
    switch (condition.type) {
      case "mcc":
        return (
          <div>
            <div className="flex items-center gap-2">
              <Label>MCC Codes</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle 
                      className="h-4 w-4 text-muted-foreground cursor-help" 
                      style={{ strokeWidth: 2.5 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Merchant Category Codes classify business types. Common
                      examples:
                    </p>
                    <ul className="list-disc list-inside mt-1 text-xs">
                      <li>5411 - Grocery Stores</li>
                      <li>5541 - Service Stations (Gas)</li>
                      <li>5812 - Restaurants</li>
                      <li>5814 - Fast Food</li>
                      <li>5912 - Drug Stores</li>
                      <li>5999 - Miscellaneous Retail</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              placeholder="e.g., 5411,5541,5812"
              value={(condition.values as string[])?.join(",") || ""}
              onChange={(e) =>
                handleValuesChange(e.target.value.split(",").filter(Boolean))
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter comma-separated MCC codes
            </p>
          </div>
        );

      case "merchant":
        return (
          <div>
            <div className="flex items-center gap-2">
              <Label>Merchant Names</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle 
                      className="h-4 w-4 text-muted-foreground cursor-help" 
                      style={{ strokeWidth: 2.5 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Match transactions from specific merchants. Examples:</p>
                    <ul className="list-disc list-inside mt-1 text-xs">
                      <li>Starbucks</li>
                      <li>Amazon</li>
                      <li>Whole Foods</li>
                    </ul>
                    <p className="mt-1 text-xs">
                      Matching is case-insensitive and partial.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              placeholder="e.g., Starbucks,Amazon,Whole Foods"
              value={(condition.values as string[])?.join(",") || ""}
              onChange={(e) =>
                handleValuesChange(e.target.value.split(",").filter(Boolean))
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter comma-separated merchant names
            </p>
          </div>
        );

      case "transaction_type":
        return (
          <div>
            <div className="flex items-center gap-2">
              <Label>Transaction Type</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle 
                      className="h-4 w-4 text-muted-foreground cursor-help" 
                      style={{ strokeWidth: 2.5 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Filter by how the transaction was made:</p>
                    <ul className="list-disc list-inside mt-1 text-xs">
                      <li>Purchase - Regular purchase</li>
                      <li>Online - E-commerce transaction</li>
                      <li>Contactless - Tap-to-pay</li>
                      <li>In-store - Physical location</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={(condition.values as string[])?.[0] || ""}
              onValueChange={(value) => handleValuesChange([value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TransactionTypeValues.purchase}>
                  Purchase
                </SelectItem>
                <SelectItem value={TransactionTypeValues.online}>
                  Online
                </SelectItem>
                <SelectItem value={TransactionTypeValues.contactless}>
                  Contactless
                </SelectItem>
                <SelectItem value={TransactionTypeValues.in_store}>
                  In-store
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "currency":
        return (
          <div>
            <div className="flex items-center gap-2">
              <Label>Currencies</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle 
                      className="h-4 w-4 text-muted-foreground cursor-help" 
                      style={{ strokeWidth: 2.5 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Match transactions in specific currencies. Examples:</p>
                    <ul className="list-disc list-inside mt-1 text-xs">
                      <li>USD - US Dollar</li>
                      <li>EUR - Euro</li>
                      <li>GBP - British Pound</li>
                      <li>CAD - Canadian Dollar</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              placeholder="e.g., USD,EUR,GBP"
              value={(condition.values as string[])?.join(",") || ""}
              onChange={(e) =>
                handleValuesChange(
                  e.target.value
                    .split(",")
                    .filter(Boolean)
                    .map((v) => v.toUpperCase())
                )
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter comma-separated currency codes (ISO 4217)
            </p>
          </div>
        );

      case "amount":
        return (
          <div>
            <div className="flex items-center gap-2">
              <Label>Amount</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle 
                      className="h-4 w-4 text-muted-foreground cursor-help" 
                      style={{ strokeWidth: 2.5 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Filter by transaction amount. Use with operations:</p>
                    <ul className="list-disc list-inside mt-1 text-xs">
                      <li>Greater Than - Amount exceeds value</li>
                      <li>Less Than - Amount below value</li>
                      <li>Equals - Exact amount match</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter amount"
              value={(condition.values as number[])?.[0]?.toString() || ""}
              onChange={(e) =>
                handleValuesChange([parseFloat(e.target.value) || 0])
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the threshold amount
            </p>
          </div>
        );

      case "category":
        return (
          <div>
            <div className="flex items-center gap-2">
              <Label>Categories</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle 
                      className="h-4 w-4 text-muted-foreground cursor-help" 
                      style={{ strokeWidth: 2.5 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Match transactions by category. Examples:</p>
                    <ul className="list-disc list-inside mt-1 text-xs">
                      <li>Groceries</li>
                      <li>Dining</li>
                      <li>Travel</li>
                      <li>Gas</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              placeholder="e.g., Groceries,Dining,Travel"
              value={(condition.values as string[])?.join(",") || ""}
              onChange={(e) =>
                handleValuesChange(e.target.value.split(",").filter(Boolean))
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter comma-separated category names
            </p>
          </div>
        );

      default:
        return (
          <div>
            <Label>Values</Label>
            <Input
              placeholder="Enter values separated by commas"
              value={(condition.values as string[])?.join(",") || ""}
              onChange={(e) =>
                handleValuesChange(e.target.value.split(",").filter(Boolean))
              }
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
            <div className="flex items-center gap-2 mb-2">
              <Label>Condition Type</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle 
                      className="h-4 w-4 text-muted-foreground cursor-help" 
                      style={{ strokeWidth: 2.5 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Choose what aspect of the transaction to match:</p>
                    <ul className="list-disc list-inside mt-1 text-xs">
                      <li>MCC Code - Business type classification</li>
                      <li>Merchant - Specific store or business</li>
                      <li>Transaction Type - How payment was made</li>
                      <li>Currency - Transaction currency</li>
                      <li>Amount - Transaction value</li>
                      <li>Category - Spending category</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={condition.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mcc">MCC Code</SelectItem>
                <SelectItem value="merchant">Merchant</SelectItem>
                <SelectItem value="transaction_type">
                  Transaction Type
                </SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Operation</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle 
                      className="h-4 w-4 text-muted-foreground cursor-help" 
                      style={{ strokeWidth: 2.5 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>How to match the condition:</p>
                    <ul className="list-disc list-inside mt-1 text-xs">
                      <li>Include - Match any of the values</li>
                      <li>Exclude - Don't match any values</li>
                      <li>Equals - Exact match</li>
                      <li>Greater Than - Value exceeds threshold</li>
                      <li>Less Than - Value below threshold</li>
                      <li>Range - Value within range</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={condition.operation}
              onValueChange={handleOperationChange}
            >
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
