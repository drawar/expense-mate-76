import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { MerchantCategoryCode } from '@/types';
import { Input } from '@/components/ui/input';
import { StoreIcon } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import MerchantCategorySelect from './merchant/MerchantCategorySelect';
import OnlineMerchantToggle from './merchant/OnlineMerchantToggle';
import { getMerchantByName } from '@/utils/storageUtils';

interface MerchantDetailsFormProps {
  onSelectMCC: (mcc: MerchantCategoryCode) => void;
  selectedMCC?: MerchantCategoryCode;
}

const MerchantDetailsForm = ({ onSelectMCC, selectedMCC }: MerchantDetailsFormProps) => {
  const form = useFormContext();
  const [isMerchantLoading, setIsMerchantLoading] = useState(false);
  
  // When merchant name changes, check for existing merchant data
  const merchantName = form.watch('merchantName');
  const debouncedMerchantName = useDebounce(merchantName, 300);
  const isOnline = form.watch('isOnline');
  
  // Simple merchant lookup effect
  useEffect(() => {
    if (!debouncedMerchantName || debouncedMerchantName.trim().length < 3 || selectedMCC) {
      return;
    }
    
    let isActive = true;
    
    const lookupMerchant = async () => {
      setIsMerchantLoading(true);
      
      try {
        const merchant = await getMerchantByName(debouncedMerchantName);
        
        if (isActive && merchant?.mcc) {
          // Set the MCC in the form and update the parent
          onSelectMCC(merchant.mcc);
          form.setValue('mcc', merchant.mcc);
          
          // If merchant has address, set that too
          if (merchant.address) {
            form.setValue('merchantAddress', merchant.address);
          }
          
          // Set online status if available
          if (typeof merchant.isOnline === 'boolean') {
            form.setValue('isOnline', merchant.isOnline);
          }
        }
      } catch (error) {
        // Silently fail - no need to show errors for lookups
      } finally {
        if (isActive) {
          setIsMerchantLoading(false);
        }
      }
    };
    
    lookupMerchant();
    
    return () => {
      isActive = false;
    };
  }, [debouncedMerchantName, form, onSelectMCC, selectedMCC]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StoreIcon className="h-5 w-5" />
          Merchant Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="merchantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Merchant Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter merchant name" 
                  {...field} 
                  className={isMerchantLoading ? "opacity-80" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <OnlineMerchantToggle />
        
        {!isOnline && (
          <FormField
            control={form.control}
            name="merchantAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter merchant address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <MerchantCategorySelect 
          selectedMCC={selectedMCC}
          onSelectMCC={onSelectMCC}
        />
      </CardContent>
    </Card>
  );
};

export default MerchantDetailsForm;
