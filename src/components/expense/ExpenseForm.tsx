
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Transaction, Merchant, PaymentMethod, Currency, MerchantCategoryCode } from '@/types';
import { currencyOptions } from '@/utils/currencyFormatter';
import { MCC_CODES, addOrUpdateMerchant, getMerchantByName } from '@/utils/storageUtils';
import { simulateRewardPoints } from '@/utils/rewardPoints';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Form,
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CreditCardIcon,
  BanknoteIcon,
  MapPinIcon,
  TagIcon,
  CoinsIcon,
  CalendarIcon,
  StoreIcon,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  merchantName: z.string().min(1, 'Merchant name is required'),
  merchantAddress: z.string().optional(),
  isOnline: z.boolean().default(false),
  amount: z.string().min(1, 'Amount is required').refine(value => !isNaN(Number(value)) && Number(value) > 0, {
    message: 'Amount must be a positive number',
  }),
  currency: z.string().min(1, 'Currency is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  paymentAmount: z.string().refine(value => !isNaN(Number(value)) && Number(value) >= 0, {
    message: 'Payment amount must be a non-negative number',
  }).optional(),
  date: z.date({
    required_error: 'Date is required',
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  paymentMethods: PaymentMethod[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  defaultValues?: Partial<FormValues>;
}

const ExpenseForm = ({ paymentMethods, onSubmit, defaultValues }: ExpenseFormProps) => {
  const { toast } = useToast();
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | undefined>();
  const [shouldOverridePayment, setShouldOverridePayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | undefined>();
  const [estimatedPoints, setEstimatedPoints] = useState(0);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      merchantName: defaultValues?.merchantName || '',
      merchantAddress: defaultValues?.merchantAddress || '',
      isOnline: defaultValues?.isOnline ?? false,
      amount: defaultValues?.amount || '',
      currency: defaultValues?.currency || 'USD',
      paymentMethodId: defaultValues?.paymentMethodId || (paymentMethods[0]?.id || ''),
      paymentAmount: defaultValues?.paymentAmount || '',
      date: defaultValues?.date || new Date(),
      notes: defaultValues?.notes || '',
    },
  });
  
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
  
  // When currency or payment method changes, check if we need to override payment amount
  const currency = form.watch('currency') as Currency;
  const paymentMethodId = form.watch('paymentMethodId');
  const amount = Number(form.watch('amount')) || 0;
  
  useEffect(() => {
    const method = paymentMethods.find(pm => pm.id === paymentMethodId);
    setSelectedPaymentMethod(method);
    
    if (method && currency !== method.currency) {
      setShouldOverridePayment(true);
    } else {
      setShouldOverridePayment(false);
      form.setValue('paymentAmount', form.watch('amount'));
    }
  }, [currency, paymentMethodId, form, paymentMethods, amount]);
  
  // Calculate estimated reward points
  useEffect(() => {
    if (!selectedPaymentMethod || amount <= 0) {
      setEstimatedPoints(0);
      return;
    }
    
    const points = simulateRewardPoints(
      amount,
      currency,
      selectedPaymentMethod,
      selectedMCC?.code,
      merchantName
    );
    
    setEstimatedPoints(points);
  }, [amount, currency, selectedPaymentMethod, selectedMCC, merchantName]);
  
  const handleFormSubmit = (values: FormValues) => {
    try {
      // Create or update merchant
      const merchant: Merchant = {
        id: '', // Will be set by addOrUpdateMerchant
        name: values.merchantName,
        address: values.merchantAddress,
        isOnline: values.isOnline,
        mcc: selectedMCC,
      };
      
      const savedMerchant = addOrUpdateMerchant(merchant);
      
      // Get selected payment method
      const paymentMethod = paymentMethods.find(pm => pm.id === values.paymentMethodId);
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }
      
      // Prepare transaction
      const transaction: Omit<Transaction, 'id'> = {
        date: format(values.date, 'yyyy-MM-dd'),
        merchant: savedMerchant,
        amount: Number(values.amount),
        currency: values.currency as Currency,
        paymentMethod,
        paymentAmount: shouldOverridePayment && values.paymentAmount 
          ? Number(values.paymentAmount) 
          : Number(values.amount),
        paymentCurrency: paymentMethod.currency,
        rewardPoints: estimatedPoints,
        notes: values.notes,
      };
      
      onSubmit(transaction);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to save transaction',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="paymentMethodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {method.type === 'credit_card' ? (
                              <CreditCardIcon className="h-4 w-4" style={{ color: method.color }} />
                            ) : (
                              <BanknoteIcon className="h-4 w-4" style={{ color: method.color }} />
                            )}
                            <span>{method.name}</span>
                            {method.type === 'credit_card' && method.lastFourDigits && (
                              <span className="text-gray-500 text-xs">...{method.lastFourDigits}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {shouldOverridePayment && (
              <FormField
                control={form.control}
                name="paymentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount ({selectedPaymentMethod?.currency})</FormLabel>
                    <FormDescription>
                      Currency differs from transaction currency. Enter the actual payment amount.
                    </FormDescription>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {estimatedPoints > 0 && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 flex items-center gap-2">
                <CoinsIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Estimated Reward Points: {estimatedPoints}
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-300">
                    Based on your selected payment method
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="submit" className="w-full md:w-auto">
              Save Transaction
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default ExpenseForm;
