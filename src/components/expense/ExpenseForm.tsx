
import { Transaction, PaymentMethod } from '@/types';
import { FormProvider } from 'react-hook-form';
import { useExpenseForm, FormValues } from '@/hooks/useExpenseForm';
import { prepareTransactionData } from '@/utils/expense/submitExpense';
import { useToast } from '@/hooks/use-toast';

// Import component sections
import MerchantDetailsForm from './MerchantDetailsForm';
import TransactionDetailsForm from './TransactionDetailsForm';
import PaymentDetailsForm from './PaymentDetailsForm';
import { useRewardPointsStandalone } from '@/hooks/expense-form/useRewardPointsStandalone';

interface ExpenseFormProps {
  paymentMethods: PaymentMethod[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  defaultValues?: Partial<FormValues>;
}

const ExpenseForm = ({ paymentMethods, onSubmit, defaultValues }: ExpenseFormProps) => {
  const { toast } = useToast();
  const {
    form,
    selectedMCC,
    setSelectedMCC,
    selectedPaymentMethod,
    shouldOverridePayment,
  } = useExpenseForm({ paymentMethods, defaultValues });
  
  // Get form values for reward point calculation
  const amount = Number(form.watch('amount')) || 0;
  const currency = form.watch('currency');
  const mcc = form.watch('mcc')?.code;
  const merchantName = form.watch('merchantName');
  const isOnline = form.watch('isOnline');
  const isContactless = form.watch('isContactless');
  
  // Use the standalone reward points hook instead of the context-dependent one
  const { estimatedPoints } = useRewardPointsStandalone(
    amount, 
    currency, 
    selectedPaymentMethod,
    mcc,
    merchantName,
    isOnline,
    isContactless
  );
  
  const handleFormSubmit = async (values: FormValues) => {
    try {
      if (!values.merchantName || values.merchantName.trim() === '') {
        toast({
          title: 'Error',
          description: 'Merchant name is required',
          variant: 'destructive',
        });
        return;
      }
      
      if (!values.paymentMethodId) {
        toast({
          title: 'Error',
          description: 'Payment method is required',
          variant: 'destructive',
        });
        return;
      }
      
      // Prepare transaction data
      const transaction = await prepareTransactionData(
        values,
        paymentMethods,
        selectedMCC,
        estimatedPoints
      );
      
      console.log('Submitting final transaction:', transaction);
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
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <MerchantDetailsForm onSelectMCC={setSelectedMCC} selectedMCC={selectedMCC} />
        <TransactionDetailsForm />
        <PaymentDetailsForm 
          paymentMethods={paymentMethods}
          selectedPaymentMethod={selectedPaymentMethod}
          shouldOverridePayment={shouldOverridePayment}
          estimatedPoints={estimatedPoints}
        />
      </form>
    </FormProvider>
  );
};

export default ExpenseForm;
