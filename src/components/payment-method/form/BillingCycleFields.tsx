import React from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface BillingCycleFieldsProps {
  statementStartDay: string;
  isMonthlyStatement: boolean;
  onStatementDayChange: (value: string) => void;
  onStatementDayBlur: () => void;
  onMonthlyStatementChange: (value: boolean) => void;
  error?: string;
  touched?: boolean;
  /** Whether to show as a compact version (for collapsible sections) */
  compact?: boolean;
}

/**
 * Billing cycle fields for credit cards.
 * Includes statement start day input and statement/calendar toggle.
 * Used in both the lean catalog flow and full form.
 */
export const BillingCycleFields: React.FC<BillingCycleFieldsProps> = ({
  statementStartDay,
  isMonthlyStatement,
  onStatementDayChange,
  onStatementDayBlur,
  onMonthlyStatementChange,
  error,
  touched,
  compact = false,
}) => {
  const helpText = isMonthlyStatement
    ? `Statement month: ${statementStartDay || "2"}th to ${statementStartDay ? parseInt(statementStartDay) - 1 || 1 : "1"}st`
    : "Calendar month: 1st to end of month";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="statementStartDay"
            className="text-sm font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Statement Day
          </Label>
          <Input
            id="statementStartDay"
            name="statementStartDay"
            type="number"
            inputMode="numeric"
            min="1"
            max="28"
            placeholder="15"
            value={statementStartDay}
            onChange={(e) => onStatementDayChange(e.target.value)}
            onBlur={onStatementDayBlur}
            className="h-11 rounded-lg text-base md:text-sm"
            style={{
              borderColor: touched && error ? "var(--color-error)" : undefined,
            }}
          />
          {touched && error && (
            <p
              className="text-xs flex items-center gap-1"
              style={{ color: "var(--color-error)" }}
            >
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>
        <div className="space-y-1.5 flex flex-col justify-end">
          <div
            className="h-11 px-3 rounded-lg border flex items-center justify-between cursor-pointer"
            style={{ borderColor: "var(--color-border)" }}
            onClick={() => onMonthlyStatementChange(!isMonthlyStatement)}
          >
            <span
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {isMonthlyStatement ? "Statement" : "Calendar"}
            </span>
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                id="isMonthlyStatement"
                checked={isMonthlyStatement}
                onCheckedChange={onMonthlyStatementChange}
              />
            </div>
          </div>
        </div>
      </div>
      <p
        className={compact ? "text-xs" : "text-xs -mt-2"}
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {helpText}
      </p>
    </div>
  );
};

export default BillingCycleFields;
