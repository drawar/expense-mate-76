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

const PaymentMethods = () => {
  const {
    data: paymentMethods = [],
    isLoading,
    refetch,
  } = usePaymentMethodsQuery();
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
  const ruleRepository = useMemo(() => RuleRepository.getInstance(), []);
  const { toast } = useToast();

  // Set first active payment method as selected on load
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedMethod) {
      const activeMethod =
        paymentMethods.find((m) => m.active) || paymentMethods[0];
      setSelectedMethod(activeMethod);
    }
  }, [paymentMethods, selectedMethod]);

  // Load rules for each payment method from the reward_rules table
  useEffect(() => {
    const fetchRulesForPaymentMethods = async () => {
      if (!paymentMethods.length) return;

      const rulesMap: Record<string, RewardRule[]> = {};

      // For each payment method, fetch its rules from the reward_rules table
      for (const method of paymentMethods) {
        // Use CardTypeIdService to generate consistent card type ID
        let cardTypeId = method.id;
        if (method.issuer && method.name) {
          cardTypeId = cardTypeIdService.generateCardTypeId(
            method.issuer,
            method.name
          );
        }

        // Use RuleRepository to get rules from Supabase reward_rules table
        const rules = await ruleRepository.getRulesForCardType(cardTypeId);
        rulesMap[method.id] = rules;
      }

      setPaymentMethodRules(rulesMap);
    };

    fetchRulesForPaymentMethods();
  }, [paymentMethods, ruleRepository]);

  const handleAddMethod = () => {
    setEditingMethod(null);
    setIsFormOpen(true);
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setEditingMethod(method);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.currentTarget);

      const method: PaymentMethod = {
        id: editingMethod?.id || uuidv4(),
        name: formData.get("name") as string,
        type: formData.get("type") as "cash" | "credit_card",
        currency: (formData.get("currency") as Currency) || ("USD" as Currency),
        issuer: (formData.get("issuer") as string) || "Cash", // Provide default issuer
        rewardRules: [],
        active: formData.get("active") === "on",
        imageUrl: editingMethod?.imageUrl,
      };

      // Add credit card specific fields if applicable
      if (method.type === "credit_card") {
        method.lastFourDigits =
          (formData.get("lastFourDigits") as string) || undefined;

        const statementDay = formData.get("statementStartDay") as string;
        if (statementDay) {
          method.statementStartDay = parseInt(statementDay, 10);
        }

        method.isMonthlyStatement = formData.get("isMonthlyStatement") === "on";
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
      const imageUrl = await storageService.uploadCardImage(file);

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

  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">
              Payment Methods
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Manage your payment cards and cash payment methods
            </p>
          </div>

          <Button onClick={handleAddMethod} className="gap-2 mt-4 sm:mt-0">
            <Plus className="h-4 w-4" />
            Add Method
          </Button>
        </div>

        {isLoading ? (
          <div className="animate-pulse text-center py-10">
            Loading payment methods...
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
          isUploading={isUploading}
        />
      </div>
    </div>
  );
};

export default PaymentMethods;
