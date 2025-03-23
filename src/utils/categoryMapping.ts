
import { MerchantCategoryCode } from '@/types';

// Map MCC codes to categories
export const getCategoryFromMCC = (mccCode?: string): string => {
  if (!mccCode) return 'Uncategorized';
  
  // Grocery and Food stores
  if (['5411', '5422', '5451', '5462', '5499', '9751'].includes(mccCode)) {
    return 'Groceries';
  }
  
  // Dining & Food
  if (['5811', '5812', '5813', '5814', '5441', '5921'].includes(mccCode)) {
    return 'Food & Drinks';
  }
  
  // Travel and Transport
  if (['4121', '4112', '3000', '7011', '4225'].includes(mccCode) || 
      (mccCode.startsWith('4') && !['4814', '4899'].includes(mccCode))) {
    return 'Travel';
  }
  
  // Utilities & Telecom
  if (['4814', '4899'].includes(mccCode)) {
    return 'Utilities';
  }
  
  // Shopping - General Merchandise
  if (['5300', '5310', '5311', '5331', '5399', '5262', '5309'].includes(mccCode)) {
    return 'Shopping';
  }
  
  // Electronics & Software
  if (['5045', '5732', '5734', '5815', '5816', '5817', '5818', '7622'].includes(mccCode)) {
    return 'Electronics';
  }
  
  // Clothing & Apparel
  if (['5137', '5139', '5611', '5621', '5631', '5641', '5651', '5655', '5661', 
       '5681', '5691', '5697', '5698', '5699'].includes(mccCode)) {
    return 'Clothing';
  }
  
  // Home & Garden
  if (['5021', '5039', '5200', '5211', '5231', '5251', '5261', '5271', '5531', 
       '5712', '5713', '5714', '5718', '5719', '5722', '5996', '5998', '7641'].includes(mccCode)) {
    return 'Home & Garden';
  }
  
  // Entertainment & Recreation
  if (['7832', '7941', '5733', '5735', '5941', '5993', '5994', '7993'].includes(mccCode)) {
    return 'Entertainment';
  }
  
  // Books, Stationery & Gifts
  if (['5111', '5192', '5942', '5943', '5947', '5970', '5972'].includes(mccCode)) {
    return 'Books & Gifts';
  }
  
  // Health & Beauty
  if (['5912', '5977', '7230', '7298'].includes(mccCode)) {
    return 'Health & Beauty';
  }
  
  // Jewelry & Luxury
  if (['5094', '5944', '5950', '7631'].includes(mccCode)) {
    return 'Jewelry & Luxury';
  }
  
  // Professional Services
  if (['7273', '7277', '7278', '7296', '7297', '7321', '7361', '7379', '7392'].includes(mccCode) ||
      (mccCode.startsWith('7') && !['7011', '7230', '7298', '7832', '7622', '7623', '7629', '7631', '7641', '7993'].includes(mccCode))) {
    return 'Services';
  }
  
  // Gas & Automotive
  if (['5541', '5940'].includes(mccCode)) {
    return 'Automotive';
  }
  
  // Specialty Retail
  if (['5193', '5945', '5946', '5948', '5949', '5963', '5964', '5971', '5973', 
       '5992', '5995', '5997', '5999', '5931', '5932', '5933', '5937'].includes(mccCode)) {
    return 'Specialty Retail';
  }
  
  // Office & Business Supplies
  if (['5044', '5046', '5065', '5072', '5074', '5978'].includes(mccCode)) {
    return 'Business Supplies';
  }
  
  // Appliance Repair
  if (['7623', '7629'].includes(mccCode)) {
    return 'Repairs & Maintenance';
  }
  
  // Political & Organizations
  if (['8351'].includes(mccCode)) {
    return 'Organizations';
  }
  
  // For any other MCC code that starts with 5 and is not explicitly categorized
  if (mccCode.startsWith('5')) {
    return 'Shopping';
  }
  
  // For any other MCC code that starts with 7 or 8
  if (mccCode.startsWith('7') || mccCode.startsWith('8')) {
    return 'Services';
  }
  
  return 'Uncategorized';
};
