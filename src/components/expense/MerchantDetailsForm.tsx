
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { MerchantCategoryCode } from '@/types';
import { MCC_CODES, getMerchantByName } from '@/utils/storageUtils';
import { Input } from '@/components/ui/input';
import { MapPinIcon, StoreIcon, TagIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const MerchantDetailsForm = () => {
  const form = useFormContext();
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | undefined>();
  
  // When merchant name changes, check for existing merchant data
  const merchantName = form.watch('merchantName');
  useEffect(() => {
    if (merchantName.trim().length >= 3) {
      const existingMerchant = getMerchantByName(merchantName);
      if (existingMerchant?.mcc) {
        setSelectedMCC(existingMerchant.mcc);
      }
    }
  }, [merchantName]);

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
                <Input placeholder="Enter merchant name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="isOnline"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Online Merchant</FormLabel>
                  <FormDescription>
                    Toggle if this is an online merchant
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        {!form.watch('isOnline') && (
          <FormField
            control={form.control}
            name="merchantAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Merchant Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="Enter merchant address" {...field} />
                    <MapPinIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div>
          <Label>Merchant Category</Label>
          <Select 
            value={selectedMCC?.code} 
            onValueChange={(value) => {
              const mcc = MCC_CODES.find(m => m.code === value);
              setSelectedMCC(mcc);
            }}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select merchant category" />
            </SelectTrigger>
            <SelectContent>
              {MCC_CODES.map((mcc) => (
                <SelectItem key={mcc.code} value={mcc.code}>
                  {mcc.description} ({mcc.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedMCC ? (
              <span className="flex items-center">
                <TagIcon className="h-3.5 w-3.5 mr-1.5" />
                {selectedMCC.description} ({selectedMCC.code})
              </span>
            ) : (
              "Optional - Select a merchant category code"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MerchantDetailsForm;
