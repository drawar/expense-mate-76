import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon, SaveIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/types';
import { getPaymentMethods, savePaymentMethods } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';

// Available categories for UOB Lady's card
const AVAILABLE_CATEGORIES = [
  'Beauty & Wellness',
  'Dining',
  'Entertainment',
  'Family',
  'Fashion',
  'Transport',
  'Travel'
];

// Maximum number of selectable categories
const MAX_CATEGORIES = 2;

interface CategorySelectorProps {
  paymentMethod: PaymentMethod;
  onCategoriesChanged?: (selectedCategories: string[]) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  paymentMethod,
  onCategoriesChanged
}) => {
  // Track current (saved) categories
  const [currentCategories, setCurrentCategories] = useState<string[]>(
    paymentMethod.selectedCategories || []
  );
  
  // Track draft selections (not yet saved)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    paymentMethod.selectedCategories || []
  );
  
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Update the state when the payment method changes
  useEffect(() => {
    const savedCategories = paymentMethod.selectedCategories || [];
    setCurrentCategories(savedCategories);
    setSelectedCategories(savedCategories);
  }, [paymentMethod]);

  // Handle category selection (draft only, not saved yet)
  const handleCategoryToggle = (category: string) => {
    if (isUpdating) return;

    let updatedCategories: string[];
    
    if (selectedCategories.includes(category)) {
      // Remove category if already selected
      updatedCategories = selectedCategories.filter(c => c !== category);
    } else {
      // Add category if under the limit, otherwise replace the first one
      if (selectedCategories.length < MAX_CATEGORIES) {
        updatedCategories = [...selectedCategories, category];
      } else {
        updatedCategories = [selectedCategories[1], category];
      }
    }

    // Update local state only (not saved yet)
    setSelectedCategories(updatedCategories);
  };
  
  // Save changes when user clicks the Save button
  const handleSaveCategories = async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Get current payment methods
      const allPaymentMethods = await getPaymentMethods();
      
      // Update this specific payment method
      const updatedPaymentMethods = allPaymentMethods.map(pm => {
        if (pm.id === paymentMethod.id) {
          return { ...pm, selectedCategories };
        }
        return pm;
      });
      
      // Save to storage
      await savePaymentMethods(updatedPaymentMethods);
      
      // Update current categories to match selection
      setCurrentCategories(selectedCategories);
      
      // Notify parent component
      if (onCategoriesChanged) {
        onCategoriesChanged(selectedCategories);
      }
      
      toast({
        title: "Categories updated",
        description: `Selected categories: ${selectedCategories.join(', ') || 'None'}`,
      });
    } catch (error) {
      console.error('Error updating categories:', error);
      toast({
        title: "Error",
        description: "Failed to update categories",
        variant: "destructive",
      });
      
      // Reset selections to last saved state on error
      setSelectedCategories(currentCategories);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Check if draft selections differ from current saved categories
  const hasUnsavedChanges = () => {
    if (selectedCategories.length !== currentCategories.length) return true;
    
    for (const category of selectedCategories) {
      if (!currentCategories.includes(category)) return true;
    }
    
    return false;
  };

  return (
    <div className="bg-slate-900 p-4 rounded-lg">
      <div className="mb-4">
        <h2 className="text-white text-lg font-medium">Category Spending</h2>
        <p className="text-gray-400">2X UNI$ on selected categories</p>
        <p className="text-white mt-3">Select up to 2 categories where you want to earn bonus points.</p>
      </div>
      
      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="flex items-center mb-4">
          <h3 className="text-white font-medium">Category Spending</h3>
          <div className="ml-auto text-sm">
            <span className="bg-blue-500 text-white rounded-full px-2 py-0.5">
              {selectedCategories.length}x
            </span>
          </div>
        </div>
        
        <div className="mb-2 flex items-center">
          <span className="text-sm text-gray-400">{selectedCategories.length}/{MAX_CATEGORIES} Selected categories (up to {MAX_CATEGORIES})</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          {AVAILABLE_CATEGORIES.map((category) => (
            <Button
              key={category}
              type="button"
              variant="ghost"
              className={cn(
                "justify-start h-10 px-4 py-2 w-full",
                selectedCategories.includes(category) 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-slate-900 hover:bg-slate-950 text-gray-300"
              )}
              onClick={() => handleCategoryToggle(category)}
              disabled={isUpdating}
            >
              {selectedCategories.includes(category) && (
                <CheckIcon className="h-4 w-4 mr-2 shrink-0 text-white" />
              )}
              <span className="truncate">{category}</span>
            </Button>
          ))}
        </div>
        
        <div className="mt-6 text-sm text-gray-400">
          <p>Monthly Cap: 3600 points</p>
          <p>Points Currency: UNI$</p>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSaveCategories}
            disabled={isUpdating || !hasUnsavedChanges()}
            className={cn(
              "px-4 py-2",
              hasUnsavedChanges() ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 text-gray-400"
            )}
          >
            {isUpdating ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              <div className="flex items-center">
                <SaveIcon className="mr-2 h-4 w-4" />
                Save
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategorySelector;