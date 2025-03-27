
import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { getPaymentMethods, savePaymentMethods } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PaymentMethodForm from '@/components/payment-method/PaymentMethodForm';
import PaymentMethodCard from '@/components/payment-method/PaymentMethodCard';
import EmptyPaymentMethodsCard from '@/components/payment-method/EmptyPaymentMethodsCard';
import ImageUploadDialog from '@/components/payment-method/ImageUploadDialog';
import { uploadCardImage } from '@/utils/storage/paymentMethods'; // Using direct import path
import { v4 as uuidv4 } from 'uuid';

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [imageUploadMethod, setImageUploadMethod] = useState<PaymentMethod | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const methods = await getPaymentMethods();
        setPaymentMethods(methods);
      } catch (error) {
        console.error('Error loading payment methods:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment methods',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentMethods();
  }, [toast]);

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
    setIsLoading(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      
      const method: PaymentMethod = {
        id: editingMethod?.id || uuidv4(),
        name: formData.get('name') as string,
        type: formData.get('type') as 'cash' | 'credit_card',
        currency: formData.get('currency') as any,
        rewardRules: editingMethod?.rewardRules || [],
        active: formData.get('active') === 'on',
        imageUrl: editingMethod?.imageUrl,
      };
      
      // Add credit card specific fields if applicable
      if (method.type === 'credit_card') {
        method.issuer = formData.get('issuer') as string || undefined;
        method.lastFourDigits = formData.get('lastFourDigits') as string || undefined;
        
        const statementDay = formData.get('statementStartDay') as string;
        if (statementDay) {
          method.statementStartDay = parseInt(statementDay, 10);
        }
        
        method.isMonthlyStatement = formData.get('isMonthlyStatement') === 'on';
      }
      
      await handleSaveMethod(method);
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment method',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMethod = async (method: PaymentMethod) => {
    try {
      let updatedMethods: PaymentMethod[];
      
      if (editingMethod) {
        // Update existing method
        updatedMethods = paymentMethods.map(m => 
          m.id === method.id ? method : m
        );
      } else {
        // Add new method
        updatedMethods = [...paymentMethods, method];
      }
      
      await savePaymentMethods(updatedMethods);
      setPaymentMethods(updatedMethods);
      
      toast({
        title: 'Success',
        description: `Payment method ${editingMethod ? 'updated' : 'added'} successfully`,
      });
      
      setIsFormOpen(false);
      setEditingMethod(null);
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment method',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const updatedMethods = paymentMethods.map(method => 
        method.id === id 
          ? { ...method, active: !method.active } 
          : method
      );
      
      await savePaymentMethods(updatedMethods);
      setPaymentMethods(updatedMethods);
      
      const method = updatedMethods.find(m => m.id === id);
      
      toast({
        title: 'Success',
        description: `${method?.name} ${method?.active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling payment method active state:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment method',
        variant: 'destructive',
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
      const imageUrl = await uploadCardImage(file, imageUploadMethod.id);
      
      if (imageUrl) {
        // Update the payment method with the image URL
        const updatedMethods = paymentMethods.map(method => 
          method.id === imageUploadMethod.id 
            ? { ...method, imageUrl } 
            : method
        );
        
        await savePaymentMethods(updatedMethods);
        setPaymentMethods(updatedMethods);
        
        toast({
          title: 'Success',
          description: 'Card image uploaded successfully',
        });
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading card image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload card image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setImageUploadMethod(null);
    }
  };

  const creditCards = paymentMethods.filter(method => method.type === 'credit_card');
  const cashMethods = paymentMethods.filter(method => method.type === 'cash');

  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Payment Methods</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Manage your payment cards and cash payment methods
            </p>
          </div>
          
          <Button onClick={handleAddMethod} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Method
          </Button>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse text-center py-10">
            Loading payment methods...
          </div>
        ) : (
          <div className="space-y-10">
            {/* Credit Cards Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Credit Cards</h2>
              
              {creditCards.length === 0 ? (
                <EmptyPaymentMethodsCard 
                  type="credit_cards"
                  onAddClick={handleAddMethod}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creditCards.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      onToggleActive={handleToggleActive}
                      onEdit={handleEditMethod}
                      onImageUpload={handleOpenImageUpload}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Cash Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Cash / Debit</h2>
              
              {cashMethods.length === 0 ? (
                <EmptyPaymentMethodsCard 
                  type="cash"
                  onAddClick={handleAddMethod}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cashMethods.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      onToggleActive={handleToggleActive}
                      onEdit={handleEditMethod}
                      onImageUpload={handleOpenImageUpload}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Pass isOpen prop to PaymentMethodForm */}
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
