
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { WifiIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

interface ContactlessToggleProps {
  isOnline: boolean;
  isCash: boolean;
}

const ContactlessToggle: React.FC<ContactlessToggleProps> = ({ isOnline, isCash }) => {
  const form = useFormContext();

  if (isOnline || isCash) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="isContactless"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5">
            <FormLabel>Contactless Payment</FormLabel>
            <FormDescription>
              Toggle if the payment was made contactless
            </FormDescription>
          </div>
          <FormControl>
            <div className="flex items-center space-x-2">
              <WifiIcon className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default ContactlessToggle;
