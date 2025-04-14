
import { PaymentMethod } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '@/services/storage';

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  try {
    const useLocalStorage = storageService.isLocalStorageMode();
    console.log(`Getting payment methods with localStorage mode: ${useLocalStorage}`);
    
    if (useLocalStorage) {
      // Try to get from local storage
      const storedPaymentMethods = localStorage.getItem('paymentMethods');
      if (storedPaymentMethods) {
        return JSON.parse(storedPaymentMethods) as PaymentMethod[];
      }
      
      // Return default methods if none found
      return getDefaultPaymentMethods();
    } else {
      // Get from Supabase
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching payment methods:', error);
        // Fallback to local storage
        return getDefaultPaymentMethods();
      }
      
      if (!data || data.length === 0) {
        console.log('No payment methods found, returning defaults');
        return getDefaultPaymentMethods();
      }
      
      // Transform to our PaymentMethod type
      const paymentMethods = data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type as 'credit_card' | 'cash',
        currency: item.currency,
        active: item.active !== false,
        issuer: item.issuer,
        lastFourDigits: item.last_four_digits,
        imageUrl: item.image_url,
        color: item.color,
        isMonthlyStatement: item.is_monthly_statement,
        statementStartDay: item.statement_start_day,
        rewardRules: (item.reward_rules || []) as any[]
      })) as PaymentMethod[];
      
      console.log(`Retrieved ${paymentMethods.length} payment methods from Supabase`);
      return paymentMethods;
    }
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return getDefaultPaymentMethods();
  }
};

function getDefaultPaymentMethods(): PaymentMethod[] {
  return [
    {
      id: uuidv4(),
      name: 'Cash (SGD)',
      type: 'cash',
      currency: 'SGD',
      active: true,
      rewardRules: []
    },
    {
      id: uuidv4(),
      name: 'Cash (USD)',
      type: 'cash',
      currency: 'USD',
      active: true,
      rewardRules: []
    },
    {
      id: uuidv4(),
      name: 'Visa Card',
      type: 'credit_card',
      currency: 'SGD',
      issuer: 'Visa',
      lastFourDigits: '1234',
      active: true,
      rewardRules: []
    }
  ];
}

export const addPaymentMethod = async (paymentMethod: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> => {
  const newMethod = { ...paymentMethod, id: uuidv4() };
  
  // Implementation of adding payment method
  try {
    const useLocalStorage = storageService.isLocalStorageMode();
    
    if (useLocalStorage) {
      const methods = await getPaymentMethods();
      const updatedMethods = [...methods, newMethod];
      localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
    } else {
      // Transform to database format
      const { error } = await supabase.from('payment_methods').insert({
        id: newMethod.id,
        name: newMethod.name,
        type: newMethod.type,
        currency: newMethod.currency,
        active: newMethod.active,
        issuer: newMethod.issuer,
        last_four_digits: newMethod.lastFourDigits,
        image_url: newMethod.imageUrl,
        color: newMethod.color,
        is_monthly_statement: newMethod.isMonthlyStatement,
        statement_start_day: newMethod.statementStartDay,
        reward_rules: newMethod.rewardRules as any
      });
      
      if (error) throw new Error(`Failed to add payment method: ${error.message}`);
    }
    
    return newMethod;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};

export const updatePaymentMethod = async (id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> => {
  try {
    const useLocalStorage = storageService.isLocalStorageMode();
    
    if (useLocalStorage) {
      const methods = await getPaymentMethods();
      const updatedMethods = methods.map(m => m.id === id ? { ...m, ...data } : m);
      localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
      return updatedMethods.find(m => m.id === id) as PaymentMethod;
    } else {
      // Transform to database format
      const dbData: any = {
        name: data.name,
        type: data.type,
        currency: data.currency,
        active: data.active,
        issuer: data.issuer,
        last_four_digits: data.lastFourDigits,
        image_url: data.imageUrl,
        color: data.color,
        is_monthly_statement: data.isMonthlyStatement,
        statement_start_day: data.statementStartDay,
        reward_rules: data.rewardRules as any
      };
      
      // Remove undefined values
      Object.keys(dbData).forEach(key => dbData[key] === undefined && delete dbData[key]);
      
      const { error } = await supabase
        .from('payment_methods')
        .update(dbData)
        .eq('id', id);
      
      if (error) throw new Error(`Failed to update payment method: ${error.message}`);
      
      // Get updated method
      const { data: updated, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (fetchError || !updated) {
        throw new Error(`Failed to fetch updated payment method: ${fetchError?.message || 'Not found'}`);
      }
      
      return {
        id: updated.id,
        name: updated.name,
        type: updated.type as 'credit_card' | 'cash',
        currency: updated.currency,
        active: updated.active !== false,
        issuer: updated.issuer,
        lastFourDigits: updated.last_four_digits,
        imageUrl: updated.image_url,
        color: updated.color,
        isMonthlyStatement: updated.is_monthly_statement,
        statementStartDay: updated.statement_start_day,
        rewardRules: (updated.reward_rules || []) as any[]
      } as PaymentMethod;
    }
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw error;
  }
};

export const deletePaymentMethod = async (id: string): Promise<boolean> => {
  try {
    const useLocalStorage = storageService.isLocalStorageMode();
    
    if (useLocalStorage) {
      const methods = await getPaymentMethods();
      const updatedMethods = methods.filter(m => m.id !== id);
      localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
    } else {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Failed to delete payment method: ${error.message}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return false;
  }
};

export const savePaymentMethods = async (paymentMethods: PaymentMethod[]): Promise<boolean> => {
  try {
    const useLocalStorage = storageService.isLocalStorageMode();
    
    if (useLocalStorage) {
      localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
    } else {
      // For Supabase, we need to handle each method individually
      for (const method of paymentMethods) {
        // Check if method exists
        const { data, error: checkError } = await supabase
          .from('payment_methods')
          .select('id')
          .eq('id', method.id)
          .maybeSingle();
        
        if (checkError) {
          console.error('Error checking payment method:', checkError);
          continue;
        }
        
        const dbData = {
          id: method.id,
          name: method.name,
          type: method.type,
          currency: method.currency,
          active: method.active,
          issuer: method.issuer,
          last_four_digits: method.lastFourDigits,
          image_url: method.imageUrl,
          color: method.color,
          is_monthly_statement: method.isMonthlyStatement,
          statement_start_day: method.statementStartDay,
          reward_rules: method.rewardRules as any
        };
        
        if (data) {
          // Update existing
          const { error } = await supabase
            .from('payment_methods')
            .update(dbData)
            .eq('id', method.id);
          
          if (error) console.error('Error updating payment method:', error);
        } else {
          // Insert new
          const { error } = await supabase
            .from('payment_methods')
            .insert(dbData);
          
          if (error) console.error('Error inserting payment method:', error);
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error saving payment methods:', error);
    return false;
  }
};

export const uploadCardImage = async (file: File, paymentMethodId: string): Promise<string | null> => {
  try {
    const useLocalStorage = storageService.isLocalStorageMode();
    
    if (useLocalStorage) {
      // For local storage, just create a data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    } else {
      // For Supabase, upload to storage
      const fileName = `${paymentMethodId}-${new Date().getTime()}`;
      const fileExt = file.name.split('.').pop();
      const filePath = `card-images/${fileName}.${fileExt}`;
      
      // Create storage bucket if it doesn't exist
      // Note: This assumes you have the appropriate storage bucket set up
      const { error: uploadError } = await supabase.storage
        .from('card-images')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('Error uploading card image:', uploadError);
        return null;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('card-images')
        .getPublicUrl(filePath);
      
      const imageUrl = data.publicUrl;
      
      // Update the payment method with the image URL
      await updatePaymentMethod(paymentMethodId, { imageUrl });
      
      return imageUrl;
    }
  } catch (error) {
    console.error('Error uploading card image:', error);
    return null;
  }
};
