import { useFormContext, useWatch } from "react-hook-form";
import { format } from "date-fns";
import { Currency } from "@/types";
import { currencyService } from "@/services/CurrencyService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, TagIcon } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { getCategoryFromMCC, getCategoryFromMerchantName, getAllCategories } from "@/utils/categoryMapping";
import { useEffect, useRef, useState } from "react";

const currencyOptions = currencyService.getCurrencyOptions();

const TransactionDetailsForm = () => {
  const form = useFormContext();
  const currency = form.watch("currency");
  
  // Track whether the user has manually changed the category
  const [userSelectedCategory, setUserSelectedCategory] = useState(false);
  
  // Store previous MCC value to detect changes
  const prevMccRef = useRef(null);
  
  // Watch for the MCC value to calculate suggested category
  const mcc = useWatch({ control: form.control, name: "mcc" });
  const merchantName = useWatch({ control: form.control, name: "merchantName" });
  
  // Update the category field when the MCC or merchant name changes
  useEffect(() => {
    // Skip if user has manually selected a category
    if (userSelectedCategory) return;
    
    let suggestedCategory = "Uncategorized";
    
    // First try to get category from MCC
    if (mcc?.code) {
      suggestedCategory = getCategoryFromMCC(mcc.code);
    } 
    // If no MCC or category couldn't be determined, try merchant name
    else if (merchantName) {
      const fromName = getCategoryFromMerchantName(merchantName);
      if (fromName) {
        suggestedCategory = fromName;
      }
    }
    
    // Set the category value
    form.setValue("category", suggestedCategory);
    
    // Update the previous MCC reference
    prevMccRef.current = mcc;
    
  }, [mcc, merchantName, form, userSelectedCategory]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Transaction Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      // Update payment amount automatically when transaction amount changes
                      const currentPaymentMethod =
                        form.getValues("paymentMethodId");
                      if (currentPaymentMethod) {
                        form.setValue("paymentAmount", e.target.value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* New Reimbursement Amount Field */}
        <FormField
          control={form.control}
          name="reimbursementAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reimbursement Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Amount reimbursed for this expense (in {currency})
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Transaction Category Field */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Category</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setUserSelectedCategory(true);
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getAllCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {mcc?.code ? 
                  `Suggested category based on MCC code ${mcc.code}` : 
                  "Choose a category for this transaction"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes about this transaction"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default TransactionDetailsForm;
