import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/types";
import {
  getCategoryGroups,
  SUBCATEGORIES,
  getCategoryColor,
  getCategoryIcon,
  CategoryGroup,
  SubcategoryConfig,
} from "@/utils/constants/categories";
import { CategoryIcon, type CategoryIconName } from "@/utils/constants/icons";
import { getEffectiveCategory, getMccCategory } from "@/utils/categoryMapping";
import { categorizationService } from "@/core/categorization";
import { cn } from "@/lib/utils";
import {
  Check,
  Search,
  RotateCcw,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

interface CategoryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onCategorySelect: (category: string, transaction: Transaction) => void;
}

interface CategorySuggestion {
  category: string;
  confidence: number;
  reason: string;
}

export function CategoryPicker({
  open,
  onOpenChange,
  transaction,
  onCategorySelect,
}: CategoryPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const categoryGroups = getCategoryGroups();

  // Load smart suggestions when drawer opens
  useEffect(() => {
    if (open && transaction) {
      setLoadingSuggestions(true);
      categorizationService
        .getCategorySuggestions(transaction, 4)
        .then((results) => {
          setSuggestions(results);
        })
        .catch((error) => {
          console.error("Error loading category suggestions:", error);
          setSuggestions([]);
        })
        .finally(() => {
          setLoadingSuggestions(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [open, transaction]);

  if (!transaction) return null;

  const currentCategory = getEffectiveCategory(transaction);
  const mccCategory = getMccCategory(transaction);
  const isRecategorized = transaction.isRecategorized;

  // Filter categories based on search
  const filteredGroups = searchQuery
    ? categoryGroups
        .map((group) => ({
          ...group,
          subcategories: group.subcategories.filter(
            (sub) =>
              sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              sub.description.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((group) => group.subcategories.length > 0)
    : categoryGroups;

  const handleSelect = (category: string) => {
    onCategorySelect(category, transaction);
    onOpenChange(false);
    setSearchQuery("");
  };

  const handleReset = () => {
    // Reset to MCC-derived category
    onCategorySelect(mccCategory, transaction);
    onOpenChange(false);
    setSearchQuery("");
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85)
      return "text-green-600 bg-green-50 border-green-200";
    if (confidence >= 0.7) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.85) return "High";
    if (confidence >= 0.7) return "Medium";
    return "Low";
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] flex flex-col overflow-hidden sm:max-w-md sm:mx-auto sm:rounded-t-xl">
        <DrawerHeader className="text-left flex-shrink-0 relative">
          <DrawerTitle className="text-lg font-semibold leading-none tracking-tight min-h-[44px] flex items-center pr-12">
            Choose Category
          </DrawerTitle>
          <DrawerDescription
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {transaction.merchant.name} - What did you buy?
          </DrawerDescription>
          <DrawerClose className="absolute right-4 top-4 h-11 w-11 flex items-center justify-center rounded-lg ring-offset-background transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X
              className="h-6 w-6"
              style={{ color: "var(--color-text-tertiary)" }}
            />
            <span className="sr-only">Close</span>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 min-h-0">
          <div className="space-y-4 pb-4">
            {/* Smart Suggestions Section */}
            {!searchQuery && suggestions.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Suggested for you</span>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => {
                    const isSelected = suggestion.category === currentCategory;
                    const iconName = getCategoryIcon(suggestion.category);
                    const color = getCategoryColor(suggestion.category);
                    const subcategory = SUBCATEGORIES.find(
                      (s) => s.name === suggestion.category
                    );

                    return (
                      <button
                        key={`suggestion-${index}`}
                        onClick={() => handleSelect(suggestion.category)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                          "border hover:border-primary/50",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:bg-muted/50"
                        )}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xl flex-shrink-0">
                          <CategoryIcon
                            iconName={iconName as CategoryIconName}
                            size={20}
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {suggestion.category}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-1.5 py-0",
                                getConfidenceColor(suggestion.confidence)
                              )}
                            >
                              {getConfidenceLabel(suggestion.confidence)}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {suggestion.reason}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="border-b mt-4 mb-2" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Or browse all categories below</span>
                </div>
              </div>
            )}

            {/* Loading state for suggestions */}
            {!searchQuery && loadingSuggestions && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Finding suggestions...
                  </span>
                </div>
              </div>
            )}

            {/* All Categories */}
            {filteredGroups.map((group) => (
              <div key={group.parent.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.parent.color }}
                  />
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <CategoryIcon
                      iconName={group.parent.icon as CategoryIconName}
                      size={16}
                    />
                    {group.parent.name}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {group.subcategories.map((subcategory) => {
                    const isSelected = subcategory.name === currentCategory;
                    // Check if this category is in suggestions (to show indicator)
                    const suggestion = suggestions.find(
                      (s) => s.category === subcategory.name
                    );

                    return (
                      <button
                        key={subcategory.id}
                        onClick={() => handleSelect(subcategory.name)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg text-left transition-colors",
                          "border hover:border-primary/50",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:bg-muted/50"
                        )}
                      >
                        <span className="text-lg">
                          <CategoryIcon
                            iconName={subcategory.icon as CategoryIconName}
                            size={18}
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm truncate">
                              {subcategory.name}
                            </span>
                            {suggestion && !searchQuery && (
                              <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {subcategory.description}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - only show if recategorized */}
        {isRecategorized && mccCategory !== "Uncategorized" && (
          <DrawerFooter className="border-t flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  Original:{" "}
                  <CategoryIcon
                    iconName={getCategoryIcon(mccCategory) as CategoryIconName}
                    size={14}
                  />{" "}
                  {mccCategory}
                </span>
              </div>
              {mccCategory !== currentCategory && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
