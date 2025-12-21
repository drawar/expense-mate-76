import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  trigger: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  id?: string; // Optional ID for sessionStorage persistence
  persistState?: boolean; // Enable sessionStorage persistence
}

const STORAGE_KEY_PREFIX = "collapsible-section-";

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  trigger,
  children,
  defaultOpen = false,
  className,
  id,
  persistState = false,
}) => {
  // Initialize state from sessionStorage if persistence is enabled
  const [isOpen, setIsOpen] = React.useState<boolean>(() => {
    if (persistState && id && typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
      if (stored !== null) {
        return stored === "true";
      }
    }
    return defaultOpen;
  });

  // Persist state to sessionStorage when it changes
  React.useEffect(() => {
    if (persistState && id && typeof window !== "undefined") {
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, String(isOpen));
    }
  }, [isOpen, persistState, id]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Dynamic trigger text based on state
  const getTriggerText = () => {
    if (isOpen) {
      return trigger
        .replace("Show", "Hide")
        .replace("Add", "Hide")
        .replace("more", "")
        .replace("advanced", "")
        .trim();
    }
    return trigger;
  };

  return (
    <div className={cn("collapsible-section", className)}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm font-medium transition-colors"
        style={{
          color: "var(--color-accent)",
          paddingTop: "var(--space-sm)",
          minHeight: "44px",
          transitionDuration: "var(--duration-fast)",
        }}
        aria-expanded={isOpen}
        aria-controls={
          id ? `collapsible-content-${id}` : `collapsible-content-${trigger}`
        }
      >
        <span>{getTriggerText()}</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
          style={{
            color: "var(--color-icon-secondary)",
            strokeWidth: 2.5,
            transitionDuration: "var(--duration-fast)",
            transitionTimingFunction: "var(--transition-smooth)",
          }}
        />
      </button>

      <div
        id={id ? `collapsible-content-${id}` : undefined}
        className={cn(
          "transition-all",
          isOpen
            ? "max-h-[1000px] opacity-100 mt-4"
            : "max-h-0 opacity-0 overflow-hidden"
        )}
        style={{
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--transition-smooth)",
        }}
      >
        {children}
      </div>
    </div>
  );
};
