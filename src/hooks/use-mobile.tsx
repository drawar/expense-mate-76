
import { useEffect, useState } from 'react';
import { useMediaQuery } from './useMediaQuery';

export function useIsMobile(): boolean {
  // Use the useMediaQuery hook to check if the screen is mobile
  const isMobileScreen = useMediaQuery('(max-width: 768px)');
  
  // We need to handle SSR case where window is not defined
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Return false during SSR, and the actual value after mounting
  return isMounted ? isMobileScreen : false;
}
