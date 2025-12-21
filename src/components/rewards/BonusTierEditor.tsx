import { useState } from "react";
import { BonusTier } from "@/core/rewards/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrashIcon, HelpCircle } from "lucide-react";

interface BonusTierEditorProps {
  tiers: BonusTier[];
  onChange: (tiers: BonusTier[]) => void;
}

export const BonusTierEditor: React.FC<BonusTierEditorProps> = ({
  tiers,
  onChange,
}) => {
  const addTier = () => {
    const newTier: BonusTier = {
      minAmount: 0,
      maxAmount: undefined,
      multiplier: 1,
    };
    onChange([...tiers, newTier]);
  };

  const updateTier = (index: number, updates: Partial<BonusTier>) => {
    const updatedTiers = tiers.map((tier, i) =>
      i === index ? { ...tier, ...updates } : tier
    );
    onChange(updatedTiers);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (
    index: number,
    field: keyof BonusTier,
    value: string | number | undefined
  ) => {
    updateTier(index, { [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Label style={{ color: "var(--color-text-primary)" }}>
            Bonus Tiers
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle
                  className="h-4 w-4 cursor-help"
                  style={{
                    color: "var(--color-text-tertiary)",
                    strokeWidth: 2.5,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Bonus tiers allow different reward rates based on transaction
                  amount or monthly spending.
                </p>
                <p className="mt-2 text-xs">
                  Example: Earn 2x points on transactions $0-$100, 3x on
                  $100-$500, 5x on $500+
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button type="button" onClick={addTier} size="sm">
          Add Tier
        </Button>
      </div>

      {tiers.length === 0 && (
        <div
          className="text-center py-4 text-sm border border-dashed rounded-lg"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          No bonus tiers configured. Click "Add Tier" to create tiered rewards.
        </div>
      )}

      {tiers.map((tier, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Tier {index + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTier(index)}
              >
                <TrashIcon
                  className="h-4 w-4"
                  style={{
                    color: "var(--color-icon-secondary)",
                    strokeWidth: 2.5,
                  }}
                />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`tier-${index}-min-amount`}
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Min Amount
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle
                          className="h-3 w-3 cursor-help"
                          style={{
                            color: "var(--color-text-tertiary)",
                            strokeWidth: 2.5,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Minimum transaction amount for this tier to apply
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id={`tier-${index}-min-amount`}
                  type="number"
                  step="0.01"
                  value={tier.minAmount || 0}
                  onChange={(e) =>
                    handleTierChange(
                      index,
                      "minAmount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`tier-${index}-max-amount`}
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Max Amount
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle
                          className="h-3 w-3 cursor-help"
                          style={{
                            color: "var(--color-text-tertiary)",
                            strokeWidth: 2.5,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Maximum transaction amount for this tier. Leave empty
                          for no upper limit.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id={`tier-${index}-max-amount`}
                  type="number"
                  step="0.01"
                  value={tier.maxAmount || ""}
                  onChange={(e) =>
                    handleTierChange(
                      index,
                      "maxAmount",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`tier-${index}-multiplier`}
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Multiplier
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle
                          className="h-3 w-3 cursor-help"
                          style={{
                            color: "var(--color-text-tertiary)",
                            strokeWidth: 2.5,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Points multiplier for this tier (e.g., 2.0 = 2x
                          points, 5.0 = 5x points)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id={`tier-${index}-multiplier`}
                  type="number"
                  step="0.1"
                  value={tier.multiplier}
                  onChange={(e) =>
                    handleTierChange(
                      index,
                      "multiplier",
                      parseFloat(e.target.value) || 1
                    )
                  }
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`tier-${index}-min-spend`}
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Min Monthly Spend
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle
                          className="h-3 w-3 cursor-help"
                          style={{
                            color: "var(--color-text-tertiary)",
                            strokeWidth: 2.5,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Optional: Minimum monthly spending required to unlock
                          this tier
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id={`tier-${index}-min-spend`}
                  type="number"
                  step="0.01"
                  value={tier.minSpend || ""}
                  onChange={(e) =>
                    handleTierChange(
                      index,
                      "minSpend",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor={`tier-${index}-name`}
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Tier Name
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle
                        className="h-3 w-3 cursor-help"
                        style={{
                          color: "var(--color-text-tertiary)",
                          strokeWidth: 2.5,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Optional: Give this tier a descriptive name (e.g.,
                        "Grocery Bonus", "Travel Tier")
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id={`tier-${index}-name`}
                type="text"
                value={tier.name || ""}
                onChange={(e) =>
                  handleTierChange(index, "name", e.target.value || undefined)
                }
                placeholder="e.g., Grocery Bonus"
              />
            </div>

            <div>
              <Label
                htmlFor={`tier-${index}-description`}
                style={{ color: "var(--color-text-primary)" }}
              >
                Description
              </Label>
              <Input
                id={`tier-${index}-description`}
                type="text"
                value={tier.description || ""}
                onChange={(e) =>
                  handleTierChange(
                    index,
                    "description",
                    e.target.value || undefined
                  )
                }
                placeholder="Optional description"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BonusTierEditor;
