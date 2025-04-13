// components/expense/form/PaymentDetailsForm.tsx
import React from 'react';
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

// Import sub-components
import PaymentMethodSelect from './PaymentMethodSelect';
import ContactlessToggle from './ContactlessToggle';
import PointsDisplay from './PointsDisplay';
import ConvertedAmountField from './ConvertedAmountField';
import { PointsCalculationResult } from '@/hooks/expense/useExpenseForm';

interface PaymentDetailsFormProps {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod | undefined;
  shouldOverridePayment: boolean;
  pointsCalculation: PointsCalculationResult;
}

/**
 * Payment details section of the expense form
 */
const PaymentDetailsForm: React.FC<PaymentDetailsFormProps> = ({ 
  paymentMethods, 
  selectedPaymentMethod, 
  shouldOverridePayment,
  pointsCalculation
}) => {
  const form = useFormContext();
  const isOnline = form.watch('isOnline');
  
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
          pointsCalculation={pointsCalculation}
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
