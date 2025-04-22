import { FormValues } from '@/hooks/useExpenseForm';
import { Transaction, Merchant, PaymentMethod, Currency, MerchantCategoryCode } from '@/types';
import { addOrUpdateMerchant } from '@/utils/storageUtils';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '@/utils/categoryMapping';
import { format } from 'date-fns';

export const prepareTransactionData = async (
  values: FormValues,
  paymentMethods: PaymentMethod[],
  selectedMCC?: MerchantCategoryCode,
  estimatedPoints?: any
): Promise<Omit<Transaction, 'id'>> => {
  // Find the selected payment method
  const paymentMethod = paymentMethods.find(pm => pm.id === values.paymentMethodId);
  if (!paymentMethod) {
    throw new Error('Payment method not found');
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
  
  // Determine category - prefer user-selected category from form if available
  let category = values.category;
  
  // Only use auto-detection if user didn't select a category
  if (!category || category === '') {
    if (selectedMCC?.code) {
      category = getCategoryFromMCC(selectedMCC.code);
    } else {
      category = getCategoryFromMerchantName(values.merchantName) || 'Uncategorized';
    }
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
    isContactless: !values.isOnline && values.isContactless,
    category,
    // Add reimbursement amount to the transaction
    reimbursementAmount: values.reimbursementAmount ? Number(values.reimbursementAmount) : 0,
  };
  
  return transaction;
};
