
import { useFormContext } from 'react-hook-form';
import { PaymentMethod, Currency } from '@/types';
import { CreditCardIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import our components
import PaymentMethodSelect from './PaymentCardRender';
import ContactlessToggle from './ContactlessToggle';
import PointsDisplay from './PointsDisplay';
import ConvertedAmountField from './ConvertedAmountField';
import { useCardAnalytics } from '@/hooks/useCardAnalytics';
import { useRewardPoints } from '@/hooks/useRewardPoints';

interface PaymentDetailsFormProps {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod | undefined;
  shouldOverridePayment: boolean;
}

const PaymentDetailsForm = ({ 
  paymentMethods, 
  selectedPaymentMethod, 
  shouldOverridePayment,
}: PaymentDetailsFormProps) => {
  const form = useFormContext();
  const isOnline = form.watch('isOnline');
  const amount = Number(form.watch('amount')) || 0;
  const currency = form.watch('currency') as Currency;
  const mcc = form.watch('mcc')?.code;
  const merchantName = form.watch('merchant')?.name;
  const isContactless = form.watch('isContactless');
  
  // Use our card analytics hook
  const { nonSgdSpendTotal, hasSgdTransactions, usedBonusPoints } = useCardAnalytics(selectedPaymentMethod);
  
  // Use our reward points hook
  const { estimatedPoints } = useRewardPoints(
    amount, 
    currency, 
    selectedPaymentMethod,
    mcc,
    merchantName,
    isOnline,
    isContactless
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PaymentMethodSelect paymentMethods={paymentMethods} />
        
        <ContactlessToggle 
          isOnline={isOnline} 
          isCash={selectedPaymentMethod?.type === 'cash' || false} 
        />
        
        <ConvertedAmountField 
          shouldOverridePayment={shouldOverridePayment} 
          selectedPaymentMethod={selectedPaymentMethod} 
        />
        
        <PointsDisplay 
          selectedPaymentMethod={selectedPaymentMethod}
          estimatedPoints={estimatedPoints}
        />
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button type="submit" className="w-full md:w-auto">
          Save Transaction
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PaymentDetailsForm;
