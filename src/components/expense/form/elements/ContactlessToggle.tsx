// components/expense/form/ContactlessToggle.tsx
import React from "react";
import { useFormContext } from "react-hook-form";
import { WifiIcon, InfoIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContactlessToggleProps {
  isOnline: boolean;
  isCash: boolean;
}

const ContactlessToggle: React.FC<ContactlessToggleProps> = ({
  isOnline,
  isCash,
}) => {
  const form = useFormContext();

  // Only show for credit card payments that are not online
  if (isOnline || isCash) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="isContactless"
      render={({ field }) => (
        <FormItem className="!space-y-0 flex flex-row items-center justify-between h-10">
          <FormLabel className="!mb-0 !mt-0 !leading-none inline-flex items-center gap-1.5">
            Contactless Payment
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle for tap-to-pay transactions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FormLabel>
          <FormControl>
            <div className="flex items-center space-x-2">
              <WifiIcon className="h-4 w-4 text-muted-foreground" />
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default ContactlessToggle;
