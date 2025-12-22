import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction } from "@/types";
import { categorizationService } from "@/core/categorization";
import { storageService } from "@/core/storage/StorageService";
import {
  getCategoryEmoji,
  getCategoryColor,
  SUBCATEGORIES,
} from "@/utils/constants/categories";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { formatDate } from "@/utils/dates/formatters";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Sparkles,
  X,
} from "lucide-react";

interface CategoryReviewQueueProps {
  onComplete?: () => void;
  onTransactionUpdate?: (transaction: Transaction) => void;
}

interface CategorySuggestion {
  category: string;
  confidence: number;
  reason: string;
}

export function CategoryReviewQueue({
  onComplete,
  onTransactionUpdate,
}: CategoryReviewQueueProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  // Load transactions needing review
  useEffect(() => {
    loadTransactionsNeedingReview();
  }, []);

  // Load suggestions when current transaction changes
  useEffect(() => {
    const currentTransaction = transactions[currentIndex];
    if (currentTransaction) {
      loadSuggestions(currentTransaction);
    }
  }, [currentIndex, transactions]);

  const loadTransactionsNeedingReview = async () => {
    setLoading(true);
    try {
      const needsReview =
        await categorizationService.getTransactionsNeedingReview();
      setTransactions(needsReview);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Error loading transactions for review:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async (transaction: Transaction) => {
    setLoadingSuggestions(true);
    try {
      const results = await categorizationService.getCategorySuggestions(
        transaction,
        4
      );
      setSuggestions(results);
    } catch (error) {
      console.error("Error loading suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleCategorySelect = async (category: string) => {
    const currentTransaction = transactions[currentIndex];
    if (!currentTransaction) return;

    try {
      // Update the transaction with the selected category
      const updates: Partial<Transaction> = {
        userCategory: category,
        isRecategorized: category !== getEffectiveCategory(currentTransaction),
        needsReview: false,
      };

      const updated = await storageService.updateTransaction(
        currentTransaction.id,
        updates
      );

      if (updated) {
        // Record the user correction for learning
        await categorizationService.recordUserCorrection(
          currentTransaction.merchant.name,
          currentTransaction.amount,
          category
        );

        // Update local state
        const newTransactions = transactions.filter(
          (t) => t.id !== currentTransaction.id
        );
        setTransactions(newTransactions);
        setReviewedCount((prev) => prev + 1);

        // Notify parent
        onTransactionUpdate?.(updated);

        // Adjust current index if needed
        if (
          currentIndex >= newTransactions.length &&
          newTransactions.length > 0
        ) {
          setCurrentIndex(newTransactions.length - 1);
        }

        // Check if we're done
        if (newTransactions.length === 0) {
          onComplete?.();
        }
      }
    } catch (error) {
      console.error("Error updating transaction category:", error);
    }
  };

  const handleSkip = () => {
    if (currentIndex < transactions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (transactions.length > 0) {
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < transactions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground mb-4">
              {reviewedCount > 0
                ? `You reviewed ${reviewedCount} transaction${reviewedCount > 1 ? "s" : ""}. Great job!`
                : "No transactions need review right now."}
            </p>
            {onComplete && <Button onClick={onComplete}>Continue</Button>}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTransaction = transactions[currentIndex];
  const currentCategory = getEffectiveCategory(currentTransaction);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Review Categories
            </CardTitle>
            <CardDescription>
              {transactions.length} transaction
              {transactions.length > 1 ? "s" : ""} need your attention
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-300 bg-amber-50"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            {currentIndex + 1} of {transactions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Transaction */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-lg">
                {currentTransaction.merchant.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {formatDate(currentTransaction.date)}
                {currentTransaction.merchant.isOnline && " • Online"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">
                {CurrencyService.format(
                  currentTransaction.amount,
                  currentTransaction.currency
                )}
              </p>
              {currentTransaction.paymentMethod && (
                <p className="text-sm text-muted-foreground">
                  {currentTransaction.paymentMethod.name}
                </p>
              )}
            </div>
          </div>
          {currentTransaction.categorySuggestionReason && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>{currentTransaction.categorySuggestionReason}</span>
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Quick pick a category</span>
          </div>

          {loadingSuggestions ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => {
                const isSelected = suggestion.category === currentCategory;
                const emoji = getCategoryEmoji(suggestion.category);
                const color = getCategoryColor(suggestion.category);

                return (
                  <button
                    key={`suggestion-${index}`}
                    onClick={() => handleCategorySelect(suggestion.category)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg text-left transition-colors",
                      "border hover:border-primary/50 hover:bg-primary/5",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted"
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-lg flex-shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {suggestion.category}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1 py-0",
                            getConfidenceColor(suggestion.confidence)
                          )}
                        >
                          {getConfidenceLabel(suggestion.confidence)}
                        </Badge>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Other Categories (Scrollable) */}
        <div>
          <span className="text-sm text-muted-foreground mb-2 block">
            Or select from all categories
          </span>
          <ScrollArea className="h-32">
            <div className="flex flex-wrap gap-1.5">
              {SUBCATEGORIES.filter(
                (sub) => !suggestions.find((s) => s.category === sub.name)
              ).map((subcategory) => {
                const isSelected = subcategory.name === currentCategory;
                return (
                  <button
                    key={subcategory.id}
                    onClick={() => handleCategorySelect(subcategory.name)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm",
                      "border transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:border-primary/30 hover:bg-muted/50"
                    )}
                  >
                    <span>{subcategory.emoji}</span>
                    <span>{subcategory.name}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === transactions.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip for now
            <X className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Progress */}
        {reviewedCount > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 inline mr-1 text-green-500" />
            {reviewedCount} reviewed this session
          </div>
        )}
      </CardContent>
    </Card>
  );
}
