import { useFormContext } from "react-hook-form";
import { MerchantCategoryCode } from "@/types";
import { StoreIcon } from "lucide-react";
// Import Moss Dark UI components
import { MossCard } from "@/components/ui/moss-card";

// Import sub-components
import OnlineMerchantToggle from "../elements/OnlineMerchantToggle";
import MerchantCategorySelect from "../elements/MerchantCategorySelect";
import MerchantNameAutocomplete from "../elements/MerchantNameAutocomplete";
import MerchantAddressAutocomplete from "../elements/MerchantAddressAutocomplete";

interface MerchantDetailsSectionProps {
  onSelectMCC: (mcc: MerchantCategoryCode) => void;
  selectedMCC?: MerchantCategoryCode | null;
}

export const MerchantDetailsSection: React.FC<MerchantDetailsSectionProps> = ({
  onSelectMCC,
  selectedMCC,
}) => {
  const form = useFormContext();
  const isOnline = form.watch("isOnline");

  return (
    <MossCard>
      <h2
        className="flex items-center gap-2 font-medium mb-4"
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

      <div className="space-y-4">
        {/* Row 1: Merchant Name and Online toggle */}
        <div className="grid grid-cols-2 gap-4 items-end">
          <MerchantNameAutocomplete onSelectMCC={onSelectMCC} />
          <OnlineMerchantToggle />
        </div>

        {/* Row 2: Merchant Category and Address side by side */}
        <div className="grid grid-cols-2 gap-4">
          <MerchantCategorySelect
            selectedMCC={selectedMCC}
            onSelectMCC={(mcc) => {
              onSelectMCC(mcc);
              form.setValue("mcc", mcc);
            }}
          />
          {!isOnline ? (
            <MerchantAddressAutocomplete />
          ) : (
            <div /> // Empty spacer when online
          )}
        </div>
      </div>
    </MossCard>
  );
};
