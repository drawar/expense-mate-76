
import { supabase } from '@/integrations/supabase/client';
import { storageService } from '@/services/storage';
import { v4 as uuidv4 } from 'uuid';

export function incrementMerchantOccurrence(merchantName: string, mcc?: any): Promise<boolean> {
  if (!merchantName || merchantName.trim().length === 0) {
    return Promise.resolve(false);
  }
  
  const normalizedName = merchantName.trim();
  
  return new Promise(async (resolve) => {
    try {
      const useLocalStorage = storageService.isLocalStorageMode();
      
      if (useLocalStorage) {
        // For local storage
        const storedMappings = localStorage.getItem('merchantCategoryMappings') || '[]';
        const mappings = JSON.parse(storedMappings);
        
        // Find if we already have this merchant
        const existingIndex = mappings.findIndex((m: any) => 
          m.merchant_name.toLowerCase() === normalizedName.toLowerCase()
        );
        
        if (existingIndex >= 0) {
          // Update existing mapping
          mappings[existingIndex].occurrence_count += 1;
          
          // Update most common MCC if provided
          if (mcc) {
            mappings[existingIndex].most_common_mcc = mcc;
          }
        } else {
          // Create new mapping
          mappings.push({
            id: uuidv4(),
            merchant_name: normalizedName,
            occurrence_count: 1,
            most_common_mcc: mcc || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        localStorage.setItem('merchantCategoryMappings', JSON.stringify(mappings));
        resolve(true);
      } else {
        // For Supabase
        // First check if mapping exists
        const { data, error } = await supabase
          .from('merchant_category_mappings')
          .select('id, occurrence_count, most_common_mcc')
          .eq('merchant_name', normalizedName)
          .limit(1);
        
        if (error) {
          console.error('Error checking merchant mapping:', error);
          resolve(false);
          return;
        }
        
        if (data && data.length > 0) {
          // Update existing mapping
          const mapping = data[0];
          const updateData: any = {
            occurrence_count: (mapping.occurrence_count || 0) + 1,
            updated_at: new Date().toISOString()
          };
          
          // Update MCC if provided
          if (mcc) {
            updateData.most_common_mcc = mcc;
          }
          
          const { error: updateError } = await supabase
            .from('merchant_category_mappings')
            .update(updateData)
            .eq('id', mapping.id);
          
          if (updateError) {
            console.error('Error updating merchant mapping:', updateError);
          }
          
          resolve(!updateError);
        } else {
          // Create new mapping
          const { error: insertError } = await supabase
            .from('merchant_category_mappings')
            .insert({
              merchant_name: normalizedName,
              occurrence_count: 1,
              most_common_mcc: mcc || null
            });
          
          if (insertError) {
            console.error('Error creating merchant mapping:', insertError);
          }
          
          resolve(!insertError);
        }
      }
    } catch (error) {
      console.error('Error tracking merchant occurrence:', error);
      resolve(false);
    }
  });
}

export function recordBonusPointsMovement(transactionId: string, paymentMethodId: string, points: number): Promise<boolean> {
  if (!points || points <= 0) {
    return Promise.resolve(false);
  }
  
  return new Promise(async (resolve) => {
    try {
      const useLocalStorage = storageService.isLocalStorageMode();
      
      if (useLocalStorage) {
        // For local storage
        const storedMovements = localStorage.getItem('bonusPointsMovements') || '[]';
        const movements = JSON.parse(storedMovements);
        
        movements.push({
          id: uuidv4(),
          transaction_id: transactionId,
          payment_method_id: paymentMethodId,
          bonus_points: points,
          created_at: new Date().toISOString()
        });
        
        localStorage.setItem('bonusPointsMovements', JSON.stringify(movements));
        resolve(true);
      } else {
        // For Supabase
        const { error } = await supabase
          .from('bonus_points_movements')
          .insert({
            transaction_id: transactionId,
            payment_method_id: paymentMethodId,
            bonus_points: points
          });
        
        if (error) {
          console.error('Error recording bonus points movement:', error);
        }
        
        resolve(!error);
      }
    } catch (error) {
      console.error('Error recording bonus points movement:', error);
      resolve(false);
    }
  });
}
