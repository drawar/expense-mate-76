
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { MerchantCategoryCode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { storageService } from '@/core/storage/StorageService';
import { StoreIcon } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

// Import Moss Dark UI components
import { MossCard } from '@/components/ui/moss-card';
import { MossInput } from '@/components/ui/moss-input';
import { CollapsibleSection } from '@/components/ui/collapsible-section';

// Import sub-components
import OnlineMerchantToggle from '../elements/OnlineMerchantToggle';
import MerchantCategorySelect from '../elements/MerchantCategorySelect';

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
  const { toast } = useToast();
  const [suggestionsChecked, setSuggestionsChecked] = useState(false);
  
  // Get merchant name from form and debounce to reduce API calls
  const merchantName = form.watch('merchantName');
  const isOnline = form.watch('isOnline');
  
  // Use a timeout for debouncing
  const [debouncedName, setDebouncedName] = useState(merchantName);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(merchantName);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [merchantName]);
  
  // Only check for suggestions once per merchant name and when no MCC is selected
  useEffect(() => {
    const checkMerchantSuggestions = async () => {
      if (debouncedName.trim().length >= 3 && !suggestionsChecked && !selectedMCC) {
        try {
          // Mark that we've checked suggestions for this merchant name
          setSuggestionsChecked(true);
          
          // Check if we have a suggestion for this merchant name
          const hasSuggestions = await storageService.hasMerchantCategorySuggestions(debouncedName);
          
          if (hasSuggestions) {
            const suggestedMCCResult = await storageService.getSuggestedMerchantCategory(debouncedName);
            
            if (suggestedMCCResult && typeof suggestedMCCResult === 'object') {
              const suggestedMCC = suggestedMCCResult as MerchantCategoryCode;
              // Set the MCC in the form and update the parent
              onSelectMCC(suggestedMCC);
              form.setValue('mcc', suggestedMCC);
              
              // Show toast to inform user about the suggested category
              toast({
                title: "Merchant category suggested",
                description: `Using ${suggestedMCC.description} (${suggestedMCC.code}) based on previous entries`,
              });
            }
          }
        } catch (error) {
          console.error('Error checking merchant suggestions:', error);
        }
      }
    };
    
    checkMerchantSuggestions();
  }, [debouncedName, form, toast, onSelectMCC, selectedMCC, suggestionsChecked]);

  // Reset suggestion check when merchant name changes significantly
  useEffect(() => {
    if (merchantName.trim().length < 3) {
      setSuggestionsChecked(false);
    }
  }, [merchantName]);

  return (
    <MossCard>
      <h2 
        className="flex items-center gap-2 font-semibold mb-4"
        style={{
          fontSize: 'var(--font-size-section-header)',
          color: 'var(--color-text-primary)',
        }}
      >
        <StoreIcon 
          className="h-5 w-5" 
          style={{
            color: 'var(--color-icon-primary)',
          }}
        />
        Merchant Details
      </h2>
      
      {/* Essential fields - always visible */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="merchantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Merchant Name</FormLabel>
              <FormControl>
                <MossInput placeholder="Enter merchant name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <OnlineMerchantToggle />
        
        <MerchantCategorySelect 
          selectedMCC={selectedMCC}
          onSelectMCC={(mcc) => {
            onSelectMCC(mcc);
            setSuggestionsChecked(true); // Mark as checked when user manually selects
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
            {!isOnline && (
              <FormField
                control={form.control}
                name="merchantAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merchant Address</FormLabel>
                    <FormControl>
                      <MossInput placeholder="Enter merchant address (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional merchant information" 
                      {...field} 
                      className="moss-input"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-input)',
                        fontSize: 'var(--font-size-body)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CollapsibleSection>
      ) : (
        // Non-minimal mode: show all fields
        <div className="space-y-4 mt-4">
          {!isOnline && (
            <FormField
              control={form.control}
              name="merchantAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant Address</FormLabel>
                  <FormControl>
                    <MossInput placeholder="Enter merchant address (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional merchant information" 
                    {...field} 
                    className="moss-input"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: 'var(--radius-input)',
                      fontSize: 'var(--font-size-body)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </MossCard>
  );
};
