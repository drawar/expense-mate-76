// components/expense/form/OnlineMerchantToggle.tsx
import { useFormContext } from "react-hook-form";
import { InfoIcon } from "lucide-react";
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

const OnlineMerchantToggle = () => {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="isOnline"
      render={({ field }) => (
        <FormItem className="!space-y-0 flex flex-row items-center justify-between h-10">
          <FormLabel className="!mb-0 !mt-0 !leading-none inline-flex items-center gap-1.5">
            Online Merchant
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle for online/e-commerce purchases</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FormLabel>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={(checked) => {
                // When toggled to online, also disable contactless (they're mutually exclusive)
                if (checked) {
                  form.setValue("isContactless", false);
                }
                field.onChange(checked);
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default OnlineMerchantToggle;
