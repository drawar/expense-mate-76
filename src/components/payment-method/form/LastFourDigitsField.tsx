import React from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LastFourDigitsFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  /** Whether this field is required */
  required?: boolean;
  /** Whether to auto-focus this field */
  autoFocus?: boolean;
}

/**
 * Input field for the last 4 digits of a card number.
 * Includes validation and error display.
 */
export const LastFourDigitsField: React.FC<LastFourDigitsFieldProps> = ({
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  autoFocus = false,
}) => {
  return (
    <div>
      <div className="py-3 flex items-center justify-between gap-4">
        <label
          htmlFor="lastFourDigits"
          className="text-base md:text-sm font-medium shrink-0"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Last 4 Digits
        </label>
        <Input
          id="lastFourDigits"
          name="lastFourDigits"
          placeholder="e.g. 1234"
          maxLength={4}
          inputMode="numeric"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value.replace(/\D/g, "");
            onChange(newValue);
          }}
          onBlur={onBlur}
          className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0"
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

export default LastFourDigitsField;
