// components/expense/form/OnlineMerchantToggle.tsx
import { useFormContext } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';

const OnlineMerchantToggle = () => {
  const form = useFormContext();

  return (
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
                onCheckedChange={(checked) => {
                  // When toggled to online, also disable contactless (they're mutually exclusive)
                  if (checked) {
                    form.setValue('isContactless', false);
                  }
                  field.onChange(checked);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};

export default OnlineMerchantToggle;
