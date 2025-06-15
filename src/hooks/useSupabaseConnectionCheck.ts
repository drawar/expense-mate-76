
// hooks/useSupabaseConnectionCheck.ts - UPDATED FILE
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { storageService } from '@/core/storage';

export const useSupabaseConnectionCheck = () => {
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        console.log('Checking Supabase connection...');
        const { data, error } = await supabase.from('payment_methods').select('id').limit(1);
        
        if (error) {
          console.error('Supabase connection error:', error);
          setSupabaseConnected(false);
          setUseLocalStorage(true);
          storageService.setLocalStorageMode(true);
          toast({
            title: 'Warning',
            description: 'Supabase connection failed. Using local storage fallback.',
            variant: 'destructive',
          });
        } else {
          console.log('Supabase connection successful');
          setSupabaseConnected(true);
          setUseLocalStorage(false);
          storageService.setLocalStorageMode(false);
        }
      } catch (error) {
        console.error('Error checking Supabase connection:', error);
        setSupabaseConnected(false);
        setUseLocalStorage(true);
        storageService.setLocalStorageMode(true);
        toast({
          title: 'Warning',
          description: 'Supabase connection failed. Using local storage fallback.',
          variant: 'destructive',
        });
      }
    };
    
    checkSupabaseConnection();
  }, [toast]);

  return { supabaseConnected, useLocalStorage };
};
