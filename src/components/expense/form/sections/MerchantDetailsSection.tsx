import { useFormContext } from "react-hook-form";
import { MerchantCategoryCode } from "@/types";
import { StoreIcon } from "lucide-react";
// Import Moss Dark UI components
import { MossCard } from "@/components/ui/moss-card";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

// Import sub-components
import OnlineMerchantToggle from "../elements/OnlineMerchantToggle";
import MerchantCategorySelect from "../elements/MerchantCategorySelect";
import MerchantNameAutocomplete from "../elements/MerchantNameAutocomplete";
import MerchantAddressAutocomplete from "../elements/MerchantAddressAutocomplete";

interface MerchantDetailsSectionProps {
  onSelectMCC: (mcc: MerchantCategoryCode) => void;
  selectedMCC?: MerchantCategoryCode | null;
  minimal?: boolean; // Enable progressive disclosure mode
}

export const MerchantDetailsSection: React.FC<MerchantDetailsSectionProps> = ({
  onSelectMCC,
  selectedMCC,
  minimal = true, // Default to minimal view with progressive disclosure
}) => {
  const form = useFormContext();
  const isOnline = form.watch("isOnline");

  return (
    <MossCard>
      <h2
        className="flex items-center gap-2 font-semibold mb-4"
        style={{
          fontSize: "var(--font-size-section-header)",
          color: "var(--color-text-primary)",
        }}
      >
        <StoreIcon
          className="h-5 w-5"
          style={{
            color: "var(--color-icon-primary)",
          }}
        />
        Merchant Details
      </h2>

      {/* Essential fields - always visible */}
      <div className="space-y-4">
        <MerchantNameAutocomplete onSelectMCC={onSelectMCC} />

        <OnlineMerchantToggle />

        <MerchantCategorySelect
          selectedMCC={selectedMCC}
          onSelectMCC={(mcc) => {
            onSelectMCC(mcc);
            form.setValue("mcc", mcc);
          }}
        />
      </div>

      {/* Optional fields - collapsible when minimal mode is enabled */}
      {minimal ? (
        <CollapsibleSection
          trigger="Add more merchant details"
          id="merchant-details-advanced"
          persistState={true}
        >
          <div className="space-y-4">
            {!isOnline && <MerchantAddressAutocomplete />}
          </div>
        </CollapsibleSection>
      ) : (
        // Non-minimal mode: show all fields
        <div className="space-y-4 mt-4">
          {!isOnline && <MerchantAddressAutocomplete />}
        </div>
      )}
    </MossCard>
  );
};
