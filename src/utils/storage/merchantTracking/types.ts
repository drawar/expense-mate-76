
import { MerchantCategoryCode } from '@/types';

// Interface for merchant occurrence tracking
export interface MerchantCategoryMapping {
  merchantName: string;
  occurrenceCount: number;
  mostCommonMCC?: MerchantCategoryCode;
  isDeleted: boolean;
}
