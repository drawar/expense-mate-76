// Test script to verify payment method updates persist correctly
import { storageService } from '@/core/storage/StorageService';
import { Transaction, PaymentMethod } from '@/types';

async function testPaymentMethodUpdate() {
  console.log('🧪 Testing payment method update persistence...\n');

  try {
    // Get all transactions
    const transactions = await storageService.getTransactions();
    
    if (transactions.length === 0) {
      console.log('❌ No transactions found. Please create a transaction first.');
      return;
    }

    // Get the first transaction
    const transaction = transactions[0];
    console.log('📝 Original transaction:');
    console.log(`  ID: ${transaction.id}`);
    console.log(`  Payment Method: ${transaction.paymentMethod.name}`);
    console.log(`  Payment Method ID: ${transaction.paymentMethod.id}\n`);

    // Get all payment methods
    const paymentMethods = await storageService.getPaymentMethods();
    
    if (paymentMethods.length < 2) {
      console.log('❌ Need at least 2 payment methods to test. Please add more payment methods.');
      return;
    }

    // Find a different payment method
    const newPaymentMethod = paymentMethods.find(pm => pm.id !== transaction.paymentMethod.id);
    
    if (!newPaymentMethod) {
      console.log('❌ Could not find a different payment method to test with.');
      return;
    }

    console.log('🔄 Updating to new payment method:');
    console.log(`  Name: ${newPaymentMethod.name}`);
    console.log(`  ID: ${newPaymentMethod.id}\n`);

    // Update the transaction with new payment method
    const updated = await storageService.updateTransaction(transaction.id, {
      paymentMethod: newPaymentMethod,
    });

    if (!updated) {
      console.log('❌ Update failed - returned null');
      return;
    }

    console.log('✅ Update returned:');
    console.log(`  Payment Method: ${updated.paymentMethod.name}`);
    console.log(`  Payment Method ID: ${updated.paymentMethod.id}\n`);

    // Fetch the transaction again to verify persistence
    const refetched = await storageService.getTransactions();
    const refetchedTransaction = refetched.find(t => t.id === transaction.id);

    if (!refetchedTransaction) {
      console.log('❌ Could not refetch transaction');
      return;
    }

    console.log('🔍 Refetched transaction:');
    console.log(`  Payment Method: ${refetchedTransaction.paymentMethod.name}`);
    console.log(`  Payment Method ID: ${refetchedTransaction.paymentMethod.id}\n`);

    // Verify the change persisted
    if (refetchedTransaction.paymentMethod.id === newPaymentMethod.id) {
      console.log('✅ SUCCESS! Payment method update persisted correctly.');
    } else {
      console.log('❌ FAILED! Payment method did not persist.');
      console.log(`  Expected: ${newPaymentMethod.id}`);
      console.log(`  Got: ${refetchedTransaction.paymentMethod.id}`);
    }

    // Restore original payment method
    console.log('\n🔄 Restoring original payment method...');
    await storageService.updateTransaction(transaction.id, {
      paymentMethod: transaction.paymentMethod,
    });
    console.log('✅ Restored original payment method');

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testPaymentMethodUpdate();
