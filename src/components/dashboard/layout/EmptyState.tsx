// components/dashboard/layout/EmptyState.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Reusable empty state component for dashboards and sections
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data available",
  description = "Add transactions to see insights and visualizations.",
  icon,
  action,
  className = "",
}) => {
  const navigate = useNavigate();

  // Default action to add expense
  const defaultAction = {
    label: "Add Transaction",
    onClick: () => navigate("/add-expense"),
  };

  const finalAction = action || defaultAction;

  return (
    <div className={`p-6 text-center ${className}`}>
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button
        onClick={finalAction.onClick}
        className="gap-2 bg-primary hover:bg-primary/90"
      >
        <PlusCircleIcon className="h-4 w-4" />
        {finalAction.label}
      </Button>
    </div>
  );
};

export default EmptyState;
