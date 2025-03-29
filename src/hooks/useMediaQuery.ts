// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

/**
 * Custom hook that returns whether the given media query matches
 * 
 * @param query The media query to check
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current match state if window exists
  const getMatches = (): boolean => {
    // Check if window is defined (to avoid SSR issues)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches);

  useEffect(() => {
    // Define a function to handle changes to the media query
    const handleChange = () => setMatches(getMatches());
    
    // Create a media query list object
    const mediaQueryList = window.matchMedia(query);
    
    // Add the listener initially
    handleChange();
    
    // Add event listener for changes
    // Use the appropriate event listener based on browser support
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(handleChange);
    }
    
    // Clean up
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}
