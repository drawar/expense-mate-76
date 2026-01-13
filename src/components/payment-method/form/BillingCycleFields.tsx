import React from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface BillingCycleFieldsProps {
  statementStartDay: string;
  onStatementDayChange: (value: string) => void;
  onStatementDayBlur: () => void;
  error?: string;
  touched?: boolean;
}

/**
 * Statement day field for credit cards.
 * Used in both the lean catalog flow and full form.
 */
export const BillingCycleFields: React.FC<BillingCycleFieldsProps> = ({
  statementStartDay,
  onStatementDayChange,
  onStatementDayBlur,
  error,
  touched,
}) => {
  return (
    <div>
      <div className="py-3 flex items-center justify-between gap-4">
        <label
          htmlFor="statementStartDay"
          className="text-base md:text-sm font-medium shrink-0"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Statement Day
        </label>
        <Input
          id="statementStartDay"
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="e.g. 15"
          value={statementStartDay}
          onChange={(e) => {
            const newValue = e.target.value.replace(/\D/g, "");
            onStatementDayChange(newValue);
          }}
          onBlur={onStatementDayBlur}
          className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-20"
          style={{
            backgroundColor: "transparent",
            color: "var(--color-text-primary)",
          }}
        />
      </div>
      {touched && error && (
        <p
          className="text-xs flex items-center gap-1 justify-end"
          style={{ color: "var(--color-error)" }}
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default BillingCycleFields;
