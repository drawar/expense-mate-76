
import { FormValues } from '@/hooks/useExpenseForm';
import { Transaction, Merchant, PaymentMethod, Currency, MerchantCategoryCode } from '@/types';
import { addOrUpdateMerchant } from '@/utils/storageUtils';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '@/utils/categoryMapping';
import { format } from 'date-fns';

export const prepareTransactionData = async (
  values: FormValues,
  paymentMethods: PaymentMethod[],
  selectedMCC: MerchantCategoryCode | undefined,
  estimatedPoints: number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    messageText?: string;
  }
): Promise<Omit<Transaction, 'id'>> => {
  // Find the selected payment method
  const paymentMethod = paymentMethods.find(pm => pm.id === values.paymentMethodId);
  if (!paymentMethod) {
    throw new Error('Selected payment method not found');
  }
  
  // Prepare merchant data
  const merchant: Merchant = {
    id: '',
    name: values.merchantName.trim(),
    address: values.merchantAddress?.trim(),
    isOnline: values.isOnline,
    mcc: selectedMCC,
  };
  
  // Save/update merchant in storage
  const savedMerchant = await addOrUpdateMerchant(merchant);
  
  // Determine category
  let category = 'Uncategorized';
  if (selectedMCC?.code) {
    category = getCategoryFromMCC(selectedMCC.code);
  } else {
    category = getCategoryFromMerchantName(values.merchantName) || 'Uncategorized';
  }
  
  // Prepare transaction data
  const transaction: Omit<Transaction, 'id'> = {
    date: format(values.date, 'yyyy-MM-dd'),
    merchant: savedMerchant,
    amount: Number(values.amount),
    currency: values.currency as Currency,
    paymentMethod: paymentMethod,
    paymentAmount: values.paymentAmount && values.paymentAmount !== values.amount
      ? Number(values.paymentAmount) 
      : Number(values.amount),
    paymentCurrency: paymentMethod.currency,
    rewardPoints: typeof estimatedPoints === 'object' 
      ? estimatedPoints.totalPoints 
      : (typeof estimatedPoints === 'number' ? estimatedPoints : 0),
    notes: values.notes,
    isContactless: !values.isOnline ? values.isContactless : false,
    category,
  };
  
  return transaction;
};
