import React from "react";
import { CreditCardIcon, PlusCircleIcon } from "lucide-react";

interface EmptyPaymentMethodStateProps {
  onAddClick: () => void;
}

export const EmptyPaymentMethodState: React.FC<
  EmptyPaymentMethodStateProps
> = ({ onAddClick }) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6"
      style={{
        border: "2px dashed var(--color-border)",
        borderRadius: "12px",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* Japandi Icon - Muted accent at 30% opacity */}
      <div
        className="p-5 mb-5"
        style={{
          backgroundColor: "var(--color-accent-subtle)",
          borderRadius: "50%",
        }}
      >
        <CreditCardIcon
          className="h-12 w-12"
          style={{
            color: "var(--color-accent)",
            opacity: 0.7,
            strokeWidth: 1.5,
          }}
        />
      </div>

      <h3
        className="text-lg font-medium mb-2"
        style={{
          color: "var(--color-text-primary)",
          letterSpacing: "-0.2px",
        }}
      >
        No Payment Methods
      </h3>

      <p
        className="text-center mb-8 max-w-sm text-sm"
        style={{
          color: "var(--color-text-secondary)",
          lineHeight: 1.5,
        }}
      >
        Add credit cards or cash payment methods to track your expenses and
        optimize reward points.
      </p>

      {/* Japandi CTA Button */}
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 font-medium transition-all duration-300 ease-out active:scale-[0.98]"
        style={{
          backgroundColor: "var(--color-accent)",
          color: "var(--color-bg)",
          borderRadius: "10px",
          padding: "14px 24px",
          letterSpacing: "0.3px",
        }}
      >
        <PlusCircleIcon className="h-4 w-4" style={{ strokeWidth: 2 }} />
        Add Your First Payment Method
      </button>
    </div>
  );
};
