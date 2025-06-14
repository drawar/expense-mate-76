
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface CategorySelectorProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  availableCategories?: string[];
}

const DEFAULT_CATEGORIES = [
  'dining',
  'groceries',
  'gas',
  'travel',
  'entertainment',
  'shopping',
  'utilities',
  'other'
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategories,
  onCategoryChange,
  availableCategories = DEFAULT_CATEGORIES
}) => {
  const handleCategoryToggle = (category: string) => {
    const updatedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    onCategoryChange(updatedCategories);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Bonus Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {availableCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <label htmlFor={category} className="text-sm capitalize cursor-pointer">
                {category}
              </label>
            </div>
          ))}
        </div>
        
        {selectedCategories.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-600 mb-2">Selected:</p>
            <div className="flex flex-wrap gap-1">
              {selectedCategories.map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategorySelector;
