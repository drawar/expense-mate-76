import React from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="space-y-1.5">
      <Label
        htmlFor="lastFourDigits"
        className="text-sm font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Last 4 Digits{" "}
        {!required && (
          <span style={{ color: "var(--color-text-tertiary)" }}>
            (optional)
          </span>
        )}
      </Label>
      <Input
        id="lastFourDigits"
        name="lastFourDigits"
        placeholder="1234"
        maxLength={4}
        inputMode="numeric"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          const newValue = e.target.value.replace(/\D/g, "");
          onChange(newValue);
        }}
        onBlur={onBlur}
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
  );
};

export default LastFourDigitsField;
