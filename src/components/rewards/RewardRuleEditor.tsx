import { useState, useEffect } from "react";
import { RewardRule, RuleCondition, BonusTier } from "@/core/rewards/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConditionEditor } from "./ConditionEditor";
import { BonusTierEditor } from "./BonusTierEditor";

export interface RewardRuleEditorProps {
  rule?: RewardRule | null;
  onSave: (rule: RewardRule) => void;
  onCancel: () => void;
}

interface ValidationErrors {
  name?: string;
  cardTypeId?: string;
  priority?: string;
  baseMultiplier?: string;
  bonusMultiplier?: string;
  blockSize?: string;
  monthlyCap?: string;
  monthlyMinSpend?: string;
}

export const RewardRuleEditor: React.FC<RewardRuleEditorProps> = ({
  rule,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(rule?.name || "");
  const [description, setDescription] = useState(rule?.description || "");
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [priority, setPriority] = useState(rule?.priority || 1);
  const [condition, setCondition] = useState<RuleCondition>(
    rule?.conditions?.[0] || {
      type: "mcc",
      operation: "include",
      values: [],
    }
  );
  const [bonusTiers, setBonusTiers] = useState<BonusTier[]>(
    rule?.reward?.bonusTiers || []
  );
  const [baseMultiplier, setBaseMultiplier] = useState(
    rule?.reward?.baseMultiplier || 1
  );
  const [bonusMultiplier, setBonusMultiplier] = useState(
    rule?.reward?.bonusMultiplier || 0
  );
  const [blockSize, setBlockSize] = useState(rule?.reward?.blockSize || 1);
  const [monthlyCap, setMonthlyCap] = useState<number | undefined>(
    rule?.reward?.monthlyCap
  );
  const [monthlyMinSpend, setMonthlyMinSpend] = useState<number | undefined>(
    rule?.reward?.monthlyMinSpend
  );
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  useEffect(() => {
    if (rule) {
      setName(rule.name || "");
      setDescription(rule.description || "");
      setEnabled(rule.enabled ?? true);
      setPriority(rule.priority || 1);
      setCondition(
        rule.conditions?.[0] || {
          type: "mcc",
          operation: "include",
          values: [],
        }
      );
      setBonusTiers(rule.reward?.bonusTiers || []);
      setBaseMultiplier(rule.reward?.baseMultiplier || 1);
      setBonusMultiplier(rule.reward?.bonusMultiplier || 0);
      setBlockSize(rule.reward?.blockSize || 1);
      setMonthlyCap(rule.reward?.monthlyCap);
      setMonthlyMinSpend(rule.reward?.monthlyMinSpend);
    }
  }, [rule]);

  /**
   * Validate the reward rule form
   * Returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate required fields
    if (!name || name.trim() === "") {
      errors.name = "Name is required";
    }

    if (!rule?.cardTypeId || rule.cardTypeId.trim() === "") {
      errors.cardTypeId = "Card type ID is required";
    }

    // Validate numeric fields
    if (priority < 0) {
      errors.priority = "Priority must be a non-negative number";
    }

    if (baseMultiplier < 0) {
      errors.baseMultiplier = "Base multiplier must be a non-negative number";
    }

    if (bonusMultiplier < 0) {
      errors.bonusMultiplier = "Bonus multiplier must be a non-negative number";
    }

    if (blockSize <= 0) {
      errors.blockSize = "Block size must be greater than 0";
    }

    if (monthlyCap !== undefined && monthlyCap < 0) {
      errors.monthlyCap = "Monthly cap must be a non-negative number";
    }

    if (monthlyMinSpend !== undefined && monthlyMinSpend < 0) {
      errors.monthlyMinSpend =
        "Monthly minimum spend must be a non-negative number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    // Validate form before saving
    if (!validateForm()) {
      return;
    }

    const updatedRule: RewardRule = {
      id: rule?.id || crypto.randomUUID(),
      cardTypeId: rule?.cardTypeId || "generic",
      name,
      description,
      enabled,
      priority,
      conditions: [condition],
      reward: {
        calculationMethod: rule?.reward?.calculationMethod || "standard",
        baseMultiplier,
        bonusMultiplier,
        pointsRoundingStrategy:
          rule?.reward?.pointsRoundingStrategy || "nearest",
        amountRoundingStrategy: rule?.reward?.amountRoundingStrategy || "floor",
        blockSize,
        bonusTiers: bonusTiers,
        monthlyCap,
        monthlyMinSpend,
        monthlySpendPeriodType: rule?.reward?.monthlySpendPeriodType,
        pointsCurrency: rule?.reward?.pointsCurrency || "points",
      },
      createdAt: rule?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    onSave(updatedRule);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Rule Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationErrors.name) {
                  setValidationErrors({ ...validationErrors, name: undefined });
                }
              }}
              className={validationErrors.name ? "border-red-500" : ""}
            />
            {validationErrors.name && (
              <p className="text-sm text-red-500 mt-1">
                {validationErrors.name}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enabled</Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority *</Label>
            <Input
              type="number"
              id="priority"
              value={priority}
              onChange={(e) => {
                setPriority(parseInt(e.target.value) || 0);
                if (validationErrors.priority) {
                  setValidationErrors({
                    ...validationErrors,
                    priority: undefined,
                  });
                }
              }}
              className={validationErrors.priority ? "border-red-500" : ""}
            />
            {validationErrors.priority && (
              <p className="text-sm text-red-500 mt-1">
                {validationErrors.priority}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Lower numbers have higher priority (e.g., 1 is applied before 2)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reward Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="baseMultiplier">Base Multiplier *</Label>
              <Input
                type="number"
                id="baseMultiplier"
                step="0.1"
                value={baseMultiplier}
                onChange={(e) => {
                  setBaseMultiplier(parseFloat(e.target.value) || 0);
                  if (validationErrors.baseMultiplier) {
                    setValidationErrors({
                      ...validationErrors,
                      baseMultiplier: undefined,
                    });
                  }
                }}
                className={
                  validationErrors.baseMultiplier ? "border-red-500" : ""
                }
              />
              {validationErrors.baseMultiplier && (
                <p className="text-sm text-red-500 mt-1">
                  {validationErrors.baseMultiplier}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Points earned per dollar (e.g., 1.5 = 1.5 points per $1)
              </p>
            </div>
            <div>
              <Label htmlFor="bonusMultiplier">Bonus Multiplier</Label>
              <Input
                type="number"
                id="bonusMultiplier"
                step="0.1"
                value={bonusMultiplier}
                onChange={(e) => {
                  setBonusMultiplier(parseFloat(e.target.value) || 0);
                  if (validationErrors.bonusMultiplier) {
                    setValidationErrors({
                      ...validationErrors,
                      bonusMultiplier: undefined,
                    });
                  }
                }}
                className={
                  validationErrors.bonusMultiplier ? "border-red-500" : ""
                }
              />
              {validationErrors.bonusMultiplier && (
                <p className="text-sm text-red-500 mt-1">
                  {validationErrors.bonusMultiplier}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Additional bonus points per dollar
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="blockSize">Block Size *</Label>
              <Input
                type="number"
                id="blockSize"
                step="0.01"
                value={blockSize}
                onChange={(e) => {
                  setBlockSize(parseFloat(e.target.value) || 1);
                  if (validationErrors.blockSize) {
                    setValidationErrors({
                      ...validationErrors,
                      blockSize: undefined,
                    });
                  }
                }}
                className={validationErrors.blockSize ? "border-red-500" : ""}
              />
              {validationErrors.blockSize && (
                <p className="text-sm text-red-500 mt-1">
                  {validationErrors.blockSize}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Minimum spend amount to earn points (e.g., 1 = per dollar)
              </p>
            </div>
            <div>
              <Label htmlFor="monthlyCap">Monthly Cap</Label>
              <Input
                type="number"
                id="monthlyCap"
                value={monthlyCap || ""}
                onChange={(e) => {
                  setMonthlyCap(
                    e.target.value ? parseFloat(e.target.value) : undefined
                  );
                  if (validationErrors.monthlyCap) {
                    setValidationErrors({
                      ...validationErrors,
                      monthlyCap: undefined,
                    });
                  }
                }}
                placeholder="No limit"
                className={validationErrors.monthlyCap ? "border-red-500" : ""}
              />
              {validationErrors.monthlyCap && (
                <p className="text-sm text-red-500 mt-1">
                  {validationErrors.monthlyCap}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Maximum bonus points per month (optional)
              </p>
            </div>
          </div>
          <div>
            <Label htmlFor="monthlyMinSpend">Monthly Minimum Spend</Label>
            <Input
              type="number"
              id="monthlyMinSpend"
              value={monthlyMinSpend || ""}
              onChange={(e) => {
                setMonthlyMinSpend(
                  e.target.value ? parseFloat(e.target.value) : undefined
                );
                if (validationErrors.monthlyMinSpend) {
                  setValidationErrors({
                    ...validationErrors,
                    monthlyMinSpend: undefined,
                  });
                }
              }}
              placeholder="No minimum"
              className={
                validationErrors.monthlyMinSpend ? "border-red-500" : ""
              }
            />
            {validationErrors.monthlyMinSpend && (
              <p className="text-sm text-red-500 mt-1">
                {validationErrors.monthlyMinSpend}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Minimum monthly spend to qualify for bonus (optional)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Condition</CardTitle>
        </CardHeader>
        <CardContent>
          <ConditionEditor condition={condition} onChange={setCondition} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bonus Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <BonusTierEditor tiers={bonusTiers} onChange={setBonusTiers} />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
};

export default RewardRuleEditor;
