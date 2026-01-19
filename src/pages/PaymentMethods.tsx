// pages/PaymentMethods.tsx
import { useState, useEffect, useMemo } from "react";
import { PaymentMethod, Currency } from "@/types";
import { usePaymentMethodsQuery } from "@/hooks/queries/usePaymentMethodsQuery";
import { useToast } from "@/hooks/use-toast";
import { storageService } from "@/core/storage/StorageService"; // Updated import
import PaymentMethodForm from "@/components/payment-method/PaymentMethodForm";
import ImageUploadDialog from "@/components/payment-method/ImageUploadDialog";
import { v4 as uuidv4 } from "uuid";
import { PaymentCarousel } from "@/components/payment-method/PaymentCarousel";
import { PaymentFunctionsList } from "@/components/payment-method/PaymentFunctionsList";
import { EmptyPaymentMethodState } from "@/components/payment-method/EmptyPaymentMethodState";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RuleRepository } from "@/core/rewards/RuleRepository";
import { RewardRule } from "@/core/rewards/types";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";
import { cardCatalogService } from "@/core/catalog";
import {
  getQuickSetupService,
  getQuickSetupConfig,
} from "@/core/rewards/QuickSetupService";

// Helper to get card network from issuer/name
const getCardNetwork = (issuer: string, name: string): string => {
  const combined = `${issuer} ${name}`.toLowerCase();
  if (combined.includes("visa")) return "1_visa";
  if (combined.includes("mastercard") || combined.includes("world elite"))
    return "2_mastercard";
  if (combined.includes("amex") || combined.includes("american express"))
    return "3_amex";
  return "4_other";
};

// Helper to get type sort order
const getTypeSortOrder = (type: string, name: string): number => {
  if (type === "credit_card") return 1;
  if (type === "gift_card") return 2;
  if (type === "cash") {
    // Cash adjustment comes after regular cash
    if (name.toLowerCase().includes("adjustment")) return 4;
    return 3;
  }
  return 5;
};

const PaymentMethods = () => {
  const {
    data: rawPaymentMethods = [],
    isLoading,
    refetch,
  } = usePaymentMethodsQuery({ includeInactive: true });

  // Sort payment methods according to priority
  const paymentMethods = useMemo(() => {
    return [...rawPaymentMethods].sort((a, b) => {
      // 1. Active status (active first)
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }

      // 2. Type order: credit_card > gift_card > cash > cash adjustment
      const typeOrderA = getTypeSortOrder(a.type, a.name);
      const typeOrderB = getTypeSortOrder(b.type, b.name);
      if (typeOrderA !== typeOrderB) {
        return typeOrderA - typeOrderB;
      }

      // 3. Within credit cards: network > issuer > name
      if (a.type === "credit_card" && b.type === "credit_card") {
        const networkA = getCardNetwork(a.issuer || "", a.name);
        const networkB = getCardNetwork(b.issuer || "", b.name);
        if (networkA !== networkB) {
          return networkA.localeCompare(networkB);
        }
        if ((a.issuer || "") !== (b.issuer || "")) {
          return (a.issuer || "").localeCompare(b.issuer || "");
        }
        return a.name.localeCompare(b.name);
      }

      // 4. Within gift cards: issuer > totalLoaded > name
      if (a.type === "gift_card" && b.type === "gift_card") {
        if ((a.issuer || "") !== (b.issuer || "")) {
          return (a.issuer || "").localeCompare(b.issuer || "");
        }
        // Higher totalLoaded first
        const loadedA = a.totalLoaded || 0;
        const loadedB = b.totalLoaded || 0;
        if (loadedA !== loadedB) {
          return loadedB - loadedA;
        }
        return a.name.localeCompare(b.name);
      }

      // Default: sort by name
      return a.name.localeCompare(b.name);
    });
  }, [rawPaymentMethods]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null
  );
  const [imageUploadMethod, setImageUploadMethod] =
    useState<PaymentMethod | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [paymentMethodRules, setPaymentMethodRules] = useState<
    Record<string, RewardRule[]>
  >({});
  // Track resolved cardTypeIds for each payment method (from catalog or generated)
  const [resolvedCardTypeIds, setResolvedCardTypeIds] = useState<
    Record<string, string>
  >({});
  const ruleRepository = useMemo(() => RuleRepository.getInstance(), []);
  const { toast } = useToast();

  // Set first active payment method as selected on load
  // Also update selectedMethod when paymentMethods changes (e.g., after refetch)
  useEffect(() => {
    if (paymentMethods.length > 0) {
      if (!selectedMethod) {
        // No selection yet - pick the first active method
        const activeMethod =
          paymentMethods.find((m) => m.active) || paymentMethods[0];
        setSelectedMethod(activeMethod);
      } else {
        // Update selectedMethod with fresh data from paymentMethods
        // This ensures we have the latest data after refetch (e.g., after Quick Setup)
        const updatedMethod = paymentMethods.find(
          (m) => m.id === selectedMethod.id
        );
        if (updatedMethod && updatedMethod !== selectedMethod) {
          setSelectedMethod(updatedMethod);
        }
      }
    }
  }, [paymentMethods, selectedMethod]);

  // Load rules for each payment method from the reward_rules table
  const fetchRulesForPaymentMethods = async () => {
    if (!paymentMethods.length) return;

    const rulesMap: Record<string, RewardRule[]> = {};
    const cardTypeIdMap: Record<string, string> = {};

    // For each payment method, fetch its rules from the reward_rules table
    for (const method of paymentMethods) {
      let rules: RewardRule[] = [];
      let cardTypeId: string | null = null;
      let effectiveCardCatalogId = method.cardCatalogId;

      // If no cardCatalogId, try to find a matching catalog entry and auto-link
      if (!effectiveCardCatalogId && method.issuer && method.name) {
        try {
          const matchingEntry = await cardCatalogService.findByIssuerAndName(
            method.issuer,
            method.name
          );
          if (matchingEntry) {
            console.log(
              `🔗 Auto-linking ${method.issuer} ${method.name} to catalog: ${matchingEntry.id}`
            );
            // Update the payment method with the cardCatalogId
            await storageService.updatePaymentMethod(method.id, {
              cardCatalogId: matchingEntry.id,
            });
            effectiveCardCatalogId = matchingEntry.id;
          }
        } catch (error) {
          console.warn(
            "Failed to auto-link payment method to catalog:",
            method.issuer,
            method.name,
            error
          );
        }
      }

      // For catalog-linked cards, use cardCatalogId to fetch rules directly
      if (effectiveCardCatalogId) {
        try {
          rules = await ruleRepository.getRulesForCardCatalogId(
            effectiveCardCatalogId
          );

          // Also try to get the cardTypeId for legacy purposes (e.g., resolvedCardTypeId)
          const catalogEntry = await cardCatalogService.getCardById(
            effectiveCardCatalogId
          );
          if (catalogEntry?.cardTypeId) {
            cardTypeId = catalogEntry.cardTypeId;
          }
        } catch (error) {
          console.warn(
            "Failed to fetch rules for card catalog:",
            effectiveCardCatalogId,
            error
          );
          rules = [];
        }
      }

      // For custom cards without cardCatalogId, generate cardTypeId for display purposes
      // but rules will be empty (rules are now stored by card_catalog_id only)
      if (!cardTypeId && method.issuer && method.name) {
        cardTypeId = cardTypeIdService.generateCardTypeId(
          method.issuer,
          method.name
        );
      }

      // Last resort: use payment method ID for cardTypeId
      if (!cardTypeId) {
        cardTypeId = method.id;
      }

      // Store the resolved cardTypeId and rules
      cardTypeIdMap[method.id] = cardTypeId;
      rulesMap[method.id] = rules;
    }

    setPaymentMethodRules(rulesMap);
    setResolvedCardTypeIds(cardTypeIdMap);
  };

  useEffect(() => {
    fetchRulesForPaymentMethods();
  }, [paymentMethods, ruleRepository]);

  const handleAddMethod = () => {
    setEditingMethod(null);
    setIsFormOpen(true);
  };

  const handleEditMethod = (method: PaymentMethod) => {
    // Get fresh data from paymentMethods in case the passed method is stale
    // This can happen if user clicks Edit right after Quick Setup before useEffect runs
    const freshMethod =
      paymentMethods.find((m) => m.id === method.id) || method;
    setEditingMethod(freshMethod);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      // Try to create FormData from real form element
      // For synthetic events (from PersonalizeCardDialog/CustomCardFormDialog),
      // FormData won't work, so we fall back to reading from elements directly
      let formData: FormData | null = null;
      try {
        if (event.currentTarget instanceof HTMLFormElement) {
          formData = new FormData(event.currentTarget);
        }
      } catch {
        // Synthetic event - FormData construction failed
      }

      // Helper to get form values - works with both real FormData and synthetic events
      type FormElements = Record<
        string,
        { value?: string; checked?: boolean } | undefined
      >;
      const elements = (event.currentTarget as { elements?: FormElements })
        ?.elements;

      const getValue = (name: string): string => {
        const fromFormData = formData?.get(name);
        if (fromFormData !== null && fromFormData !== undefined) {
          return fromFormData as string;
        }
        return elements?.[name]?.value || "";
      };

      const getChecked = (name: string): boolean => {
        const fromFormData = formData?.get(name);
        if (fromFormData !== null && fromFormData !== undefined) {
          return fromFormData === "on";
        }
        return elements?.[name]?.checked || false;
      };

      const method: PaymentMethod = {
        // Preserve existing fields when editing
        ...(editingMethod || {}),
        id: editingMethod?.id || uuidv4(),
        name: getValue("name"),
        type: getValue("type") as "cash" | "credit_card" | "gift_card",
        currency: (getValue("currency") as Currency) || ("USD" as Currency),
        issuer: getValue("issuer") || "Cash", // Provide default issuer
        active: getChecked("active"),
      };

      // Add last 4 digits for credit card and gift card
      if (method.type === "credit_card" || method.type === "gift_card") {
        method.lastFourDigits = getValue("lastFourDigits") || undefined;
      }

      // Add credit card specific fields if applicable
      if (method.type === "credit_card") {
        const pointsCurrency = getValue("pointsCurrency");
        if (pointsCurrency) {
          method.pointsCurrency = pointsCurrency;
        }

        const rewardCurrencyId = getValue("rewardCurrencyId");
        if (rewardCurrencyId) {
          method.rewardCurrencyId = rewardCurrencyId;
        }

        const statementDay = getValue("statementStartDay");
        // Always set statementStartDay - use undefined if empty to allow clearing
        method.statementStartDay = statementDay
          ? parseInt(statementDay, 10)
          : undefined;

        method.isMonthlyStatement = getChecked("isMonthlyStatement");

        // Card catalog linkage
        const cardCatalogId = getValue("cardCatalogId");
        if (cardCatalogId) {
          method.cardCatalogId = cardCatalogId;
        }

        const nickname = getValue("nickname");
        if (nickname) {
          method.nickname = nickname;
        }
      }

      // Add gift card specific fields if applicable
      if (method.type === "gift_card") {
        const totalLoaded = getValue("totalLoaded");
        if (totalLoaded) {
          method.totalLoaded = parseFloat(totalLoaded);
        }
        const purchaseDate = getValue("purchaseDate");
        if (purchaseDate) {
          method.purchaseDate = purchaseDate;
        }
      }

      await handleSaveMethod(method);
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive",
      });
    }
  };

  const handleSaveMethod = async (method: PaymentMethod) => {
    try {
      let updatedMethods: PaymentMethod[];
      const isNewCatalogCard = !editingMethod && method.cardCatalogId;

      if (editingMethod) {
        // Update existing method
        updatedMethods = paymentMethods.map((m) =>
          m.id === method.id ? method : m
        );
      } else {
        // Add new method
        updatedMethods = [...paymentMethods, method];
      }

      // Use the updated StorageService instead
      await storageService.savePaymentMethods(updatedMethods);

      toast({
        title: "Success",
        description: `Payment method ${editingMethod ? "updated" : "added"} successfully`,
      });

      setIsFormOpen(false);
      setEditingMethod(null);

      // Auto-initialize reward rules for new catalog cards
      if (isNewCatalogCard && method.cardCatalogId) {
        const setupConfig = getQuickSetupConfig({
          issuer: method.issuer,
          name: method.name,
        });

        if (setupConfig) {
          try {
            // Get the cardTypeId from the catalog entry
            const catalogEntry = await cardCatalogService.getCardById(
              method.cardCatalogId
            );
            const cardTypeId =
              catalogEntry?.cardTypeId ||
              cardTypeIdService.generateCardTypeId(
                method.issuer || "",
                method.name
              );

            // Run quick setup
            const quickSetupService = getQuickSetupService();
            const result = await quickSetupService.runSetupIfAvailable(
              { id: method.id, issuer: method.issuer, name: method.name },
              cardTypeId
            );

            if (result.success && result.rulesCreated > 0) {
              toast({
                title: "Reward Rules Initialized",
                description: `${result.rulesCreated} reward rule${result.rulesCreated > 1 ? "s" : ""} configured for ${method.name}`,
              });
            }
          } catch (setupError) {
            console.error("Error auto-initializing reward rules:", setupError);
            // Don't show error toast - card was saved successfully,
            // user can manually set up rules later
          }
        }
      }

      refetch(); // Refresh the data
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const updatedMethods = paymentMethods.map((method) =>
        method.id === id ? { ...method, active: !method.active } : method
      );

      // Use the updated StorageService instead
      await storageService.savePaymentMethods(updatedMethods);

      const method = updatedMethods.find((m) => m.id === id);

      toast({
        title: "Success",
        description: `${method?.name} ${method?.active ? "activated" : "deactivated"} successfully`,
      });

      refetch(); // Refresh the data
    } catch (error) {
      console.error("Error toggling payment method active state:", error);
      toast({
        title: "Error",
        description: "Failed to update payment method",
        variant: "destructive",
      });
    }
  };

  const handleOpenImageUpload = (method: PaymentMethod) => {
    setImageUploadMethod(method);
  };

  const handleImageUpload = async (file: File) => {
    if (!imageUploadMethod) return;

    setIsUploading(true);

    try {
      const imageUrl = await storageService.uploadCardImage(
        file,
        imageUploadMethod.issuer,
        imageUploadMethod.name
      );

      if (imageUrl) {
        const updatedMethods = paymentMethods.map((method) =>
          method.id === imageUploadMethod.id ? { ...method, imageUrl } : method
        );

        await storageService.savePaymentMethods(updatedMethods);

        toast({
          title: "Success",
          description: "Card image uploaded successfully",
        });

        refetch();
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading card image:", error);
      toast({
        title: "Error",
        description: "Failed to upload card image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setImageUploadMethod(null);
    }
  };

  const handleImageRemove = async () => {
    if (!imageUploadMethod?.imageUrl) return;

    try {
      // Delete from Supabase Storage
      await storageService.deleteCardImage(imageUploadMethod.imageUrl);

      // Update payment method to remove imageUrl
      const updatedMethods = paymentMethods.map((method) =>
        method.id === imageUploadMethod.id
          ? { ...method, imageUrl: undefined }
          : method
      );

      await storageService.savePaymentMethods(updatedMethods);

      toast({
        title: "Success",
        description: "Card image removed successfully",
      });

      refetch();
    } catch (error) {
      console.error("Error removing card image:", error);
      toast({
        title: "Error",
        description: "Failed to remove card image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-16 px-4 md:px-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gradient">
              Payment Methods
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Manage your payment cards and cash payment methods
            </p>
          </div>

          <Button
            onClick={handleAddMethod}
            className="w-full sm:w-auto mt-4 sm:mt-0 gap-2"
            aria-label="Add new payment method"
          >
            <Plus className="h-4 w-4" />
            Add Method
          </Button>
        </div>

        {isLoading ? (
          <div
            className="flex flex-col items-center justify-center py-16"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <div
              className="w-10 h-10 border-2 rounded-full animate-spin mb-4"
              style={{
                borderColor: "var(--color-border)",
                borderTopColor: "var(--color-accent)",
              }}
            />
            <span className="text-sm">Loading payment methods...</span>
          </div>
        ) : paymentMethods.length === 0 ? (
          <EmptyPaymentMethodState onAddClick={handleAddMethod} />
        ) : (
          <div className="space-y-8">
            {/* Card Carousel */}
            <div className="mb-8 relative">
              <PaymentCarousel
                paymentMethods={paymentMethods}
                selectedMethod={selectedMethod}
                onSelectMethod={setSelectedMethod}
              />
            </div>

            {/* Functions List */}
            {selectedMethod && (
              <PaymentFunctionsList
                paymentMethod={selectedMethod}
                rewardRules={
                  selectedMethod
                    ? paymentMethodRules[selectedMethod.id] || []
                    : []
                }
                onToggleActive={handleToggleActive}
                onEdit={handleEditMethod}
                onImageUpload={handleOpenImageUpload}
                onRulesChanged={() => {
                  // Refetch both rules and payment methods
                  // Quick setup may update payment_methods.points_currency directly
                  fetchRulesForPaymentMethods();
                  refetch();
                }}
                resolvedCardTypeId={resolvedCardTypeIds[selectedMethod.id]}
              />
            )}
          </div>
        )}

        {/* Payment Method Form Modal */}
        <PaymentMethodForm
          currentMethod={editingMethod}
          isEditing={!!editingMethod}
          isLoading={isLoading}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingMethod(null);
          }}
          onSubmit={handleFormSubmit}
        />

        {/* Image Upload Dialog */}
        <ImageUploadDialog
          open={!!imageUploadMethod}
          onOpenChange={(open) => {
            if (!open) setImageUploadMethod(null);
          }}
          paymentMethod={imageUploadMethod}
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
          isUploading={isUploading}
        />
      </div>
    </div>
  );
};

export default PaymentMethods;
