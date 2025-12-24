import * as React from "react";
import { MossCard } from "@/components/ui/moss-card";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { cn } from "@/lib/utils";

export interface FormSectionProps {
  /** Section title displayed in the header */
  title: string;
  /** Icon to display before the title (should be a Lucide icon component) */
  icon?: React.ReactNode;
  /** Main content of the section (always visible) */
  children: React.ReactNode;
  /** Optional collapsible content (progressive disclosure) */
  collapsibleContent?: React.ReactNode;
  /** Trigger text for the collapsible section */
  collapsibleTrigger?: string;
  /** Unique ID for collapsible state persistence */
  collapsibleId?: string;
  /** Whether the collapsible section should be open by default */
  collapsibleDefaultOpen?: boolean;
  /** Additional className for the root element */
  className?: string;
  /** Additional className for the content container */
  contentClassName?: string;
}

/**
 * A standardized form section component that wraps content in a MossCard
 * with an optional collapsible area for progressive disclosure.
 *
 * Use this component to create consistent form sections across the app.
 *
 * @example
 * // Simple form section without collapsible
 * <FormSection title="Basic Info" icon={<UserIcon className="h-5 w-5" />}>
 *   <Input name="name" />
 *   <Input name="email" />
 * </FormSection>
 *
 * @example
 * // Form section with collapsible content (progressive disclosure)
 * <FormSection
 *   title="Merchant Details"
 *   icon={<StoreIcon className="h-5 w-5" />}
 *   collapsibleContent={<MerchantAddressAutocomplete />}
 *   collapsibleTrigger="Show merchant details"
 *   collapsibleId="merchant-details-advanced"
 * >
 *   <MerchantNameAutocomplete />
 *   <MerchantCategorySelect />
 * </FormSection>
 */
export function FormSection({
  title,
  icon,
  children,
  collapsibleContent,
  collapsibleTrigger = "Show more",
  collapsibleId,
  collapsibleDefaultOpen = false,
  className,
  contentClassName,
}: FormSectionProps) {
  return (
    <MossCard className={className}>
      {/* Section Header */}
      <h2
        className="flex items-center gap-2 font-medium mb-4"
        style={{
          fontSize: "var(--font-size-section-header)",
          color: "var(--color-text-primary)",
        }}
      >
        {icon &&
          React.isValidElement(icon) &&
          React.cloneElement(icon as React.ReactElement, {
            className: cn(
              "h-5 w-5",
              (icon as React.ReactElement).props?.className
            ),
            style: {
              color: "var(--color-icon-primary)",
              ...(icon as React.ReactElement).props?.style,
            },
          })}
        {title}
      </h2>

      {/* Main Content (always visible) */}
      <div className={cn("space-y-4", contentClassName)}>{children}</div>

      {/* Collapsible Content (progressive disclosure) */}
      {collapsibleContent && (
        <CollapsibleSection
          trigger={collapsibleTrigger}
          id={collapsibleId}
          persistState={!!collapsibleId}
          defaultOpen={collapsibleDefaultOpen}
        >
          <div className="space-y-4">{collapsibleContent}</div>
        </CollapsibleSection>
      )}
    </MossCard>
  );
}

export default FormSection;
