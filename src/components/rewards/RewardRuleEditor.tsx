import { useState, useEffect } from "react";
import { RewardRule, RuleCondition, BonusTier } from "@/core/rewards/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConditionEditor } from "./ConditionEditor";
import { BonusTierEditor } from "./BonusTierEditor";

export interface RewardRuleEditorProps {
  rule?: RewardRule | null;
  ruleCount?: number; // Total number of rules for this card (for priority dropdown)
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
  ruleCount = 1,
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
  const [monthlyCapType, setMonthlyCapType] = useState<
    "bonus_points" | "spend_amount"
  >(rule?.reward?.monthlyCapType || "bonus_points");
  const [monthlyMinSpend, setMonthlyMinSpend] = useState<number | undefined>(
    rule?.reward?.monthlyMinSpend
  );
  const [capGroupId, setCapGroupId] = useState<string>(
    rule?.reward?.capGroupId || ""
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
      setMonthlyCapType(rule.reward?.monthlyCapType || "bonus_points");
      setMonthlyMinSpend(rule.reward?.monthlyMinSpend);
      setCapGroupId(rule.reward?.capGroupId || "");
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
        monthlyCapType: monthlyCap ? monthlyCapType : undefined,
        monthlyMinSpend,
        monthlySpendPeriodType: rule?.reward?.monthlySpendPeriodType,
        pointsCurrency: rule?.reward?.pointsCurrency || "points",
        capGroupId: capGroupId || undefined,
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
            <Label
              htmlFor="name"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Name <span style={{ color: "var(--color-error)" }}>*</span>
            </Label>
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
              style={{
                borderColor: validationErrors.name
                  ? "var(--color-error)"
                  : undefined,
              }}
            />
            {validationErrors.name && (
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-error)" }}
              >
                {validationErrors.name}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="description"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="enabled"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Enabled
            </Label>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          <div>
            <Label
              htmlFor="priority"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Priority <span style={{ color: "var(--color-error)" }}>*</span>
            </Label>
            <Select
              value={String(priority)}
              onValueChange={(value) => {
                setPriority(parseInt(value) || 1);
                if (validationErrors.priority) {
                  setValidationErrors({
                    ...validationErrors,
                    priority: undefined,
                  });
                }
              }}
            >
              <SelectTrigger
                id="priority"
                style={{
                  borderColor: validationErrors.priority
                    ? "var(--color-error)"
                    : undefined,
                }}
              >
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // For new rules, allow inserting at any position (1 to ruleCount + 1)
                  // For existing rules, show current positions (1 to ruleCount)
                  const maxPriority = rule ? ruleCount : ruleCount + 1;
                  const options = [];
                  for (let i = maxPriority; i >= 1; i--) {
                    let label = String(i);
                    if (i === maxPriority) label += " (Highest)";
                    else if (i === 1) label += " (Lowest)";
                    options.push(
                      <SelectItem key={i} value={String(i)}>
                        {label}
                      </SelectItem>
                    );
                  }
                  return options;
                })()}
              </SelectContent>
            </Select>
            {validationErrors.priority && (
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-error)" }}
              >
                {validationErrors.priority}
              </p>
            )}
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Higher priority rules are applied first
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
              <Label
                htmlFor="baseMultiplier"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Base Multiplier{" "}
                <span style={{ color: "var(--color-error)" }}>*</span>
              </Label>
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
                style={{
                  borderColor: validationErrors.baseMultiplier
                    ? "var(--color-error)"
                    : undefined,
                }}
              />
              {validationErrors.baseMultiplier && (
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--color-error)" }}
                >
                  {validationErrors.baseMultiplier}
                </p>
              )}
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Points earned per dollar (e.g., 1.5 = 1.5 points per $1)
              </p>
            </div>
            <div>
              <Label
                htmlFor="bonusMultiplier"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Bonus Multiplier
              </Label>
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
                style={{
                  borderColor: validationErrors.bonusMultiplier
                    ? "var(--color-error)"
                    : undefined,
                }}
              />
              {validationErrors.bonusMultiplier && (
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--color-error)" }}
                >
                  {validationErrors.bonusMultiplier}
                </p>
              )}
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Additional bonus points per dollar
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="blockSize"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Block Size{" "}
                <span style={{ color: "var(--color-error)" }}>*</span>
              </Label>
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
                style={{
                  borderColor: validationErrors.blockSize
                    ? "var(--color-error)"
                    : undefined,
                }}
              />
              {validationErrors.blockSize && (
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--color-error)" }}
                >
                  {validationErrors.blockSize}
                </p>
              )}
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Earn points per $X spent (e.g., 1 = per $1, 5 = per $5)
              </p>
            </div>
            <div>
              <Label
                htmlFor="monthlyCap"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Monthly Cap
              </Label>
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
                style={{
                  borderColor: validationErrors.monthlyCap
                    ? "var(--color-error)"
                    : undefined,
                }}
              />
              {validationErrors.monthlyCap && (
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--color-error)" }}
                >
                  {validationErrors.monthlyCap}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="monthlyCapType"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Cap Type
              </Label>
              <Select
                value={monthlyCapType}
                onValueChange={(value: "bonus_points" | "spend_amount") =>
                  setMonthlyCapType(value)
                }
              >
                <SelectTrigger id="monthlyCapType">
                  <SelectValue placeholder="Select cap type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bonus_points">Bonus Points</SelectItem>
                  <SelectItem value="spend_amount">Spend Amount</SelectItem>
                </SelectContent>
              </Select>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {monthlyCapType === "bonus_points"
                  ? "Cap limits total bonus points earned"
                  : "Cap limits eligible spend amount ($)"}
              </p>
            </div>
            <div>
              <Label
                htmlFor="capGroupId"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Cap Group ID
              </Label>
              <Input
                type="text"
                id="capGroupId"
                value={capGroupId}
                onChange={(e) => setCapGroupId(e.target.value)}
                placeholder="e.g., 5x-food-cap"
              />
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Rules with the same Cap Group ID share a single monthly cap
              </p>
            </div>
          </div>
          <div>
            <Label
              htmlFor="monthlyMinSpend"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Monthly Minimum Spend
            </Label>
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
              style={{
                borderColor: validationErrors.monthlyMinSpend
                  ? "var(--color-error)"
                  : undefined,
              }}
            />
            {validationErrors.monthlyMinSpend && (
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-error)" }}
              >
                {validationErrors.monthlyMinSpend}
              </p>
            )}
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-text-tertiary)" }}
            >
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
