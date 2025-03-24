
import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { getPaymentMethods, savePaymentMethods, uploadCardImage } from '@/utils/storageUtils';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CreditCardIcon,
  BanknoteIcon,
  PlusCircleIcon,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import PaymentMethodCard from '@/components/payment-method/PaymentMethodCard';
import PaymentMethodForm from '@/components/payment-method/PaymentMethodForm';
import EmptyPaymentMethodsCard from '@/components/payment-method/EmptyPaymentMethodsCard';
import ImageUploadDialog from '@/components/payment-method/ImageUploadDialog';

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  // Load payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setIsLoading(true);
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
  
  // Toggle payment method active status
  const toggleActiveStatus = async (id: string) => {
    try {
      const updatedMethods = paymentMethods.map(method => 
        method.id === id ? { ...method, active: !method.active } : method
      );
      
      setPaymentMethods(updatedMethods);
      await savePaymentMethods(updatedMethods);
      
      toast({
        title: 'Status Updated',
        description: `Payment method ${updatedMethods.find(m => m.id === id)?.active ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling payment method status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment method status',
        variant: 'destructive',
      });
    }
  };
  
  // Open dialog to edit a payment method
  const openEditDialog = (method: PaymentMethod) => {
    setCurrentMethod(method);
    setIsEditing(true);
    setIsDialogOpen(true);
  };
  
  // Open dialog to add a new payment method
  const openAddDialog = () => {
    setCurrentMethod(null);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Open dialog to upload image
  const openImageDialog = (method: PaymentMethod) => {
    setCurrentMethod(method);
    setIsImageDialogOpen(true);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setCurrentMethod(null);
      setIsEditing(false);
    }, 300);
  };
  
  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    try {
      setIsLoading(true);
      const formData = new FormData(event.currentTarget);
      
      const name = formData.get('name') as string;
      const type = formData.get('type') as 'cash' | 'credit_card';
      const currency = formData.get('currency') as any; // Will be validated as Currency type later
      const active = !!formData.get('active');
      
      // Credit card specific fields
      const lastFourDigits = type === 'credit_card' ? formData.get('lastFourDigits') as string : undefined;
      const issuer = type === 'credit_card' ? formData.get('issuer') as string : undefined;
      const statementStartDay = type === 'credit_card' && formData.get('statementStartDay') 
        ? Number(formData.get('statementStartDay')) 
        : undefined;
      const isMonthlyStatement = type === 'credit_card' ? formData.get('isMonthlyStatement') === 'on' : undefined;
      
      // Create payment method object
      const paymentMethod: PaymentMethod = {
        id: isEditing && currentMethod ? currentMethod.id : uuidv4(),
        name,
        type,
        currency,
        active,
        lastFourDigits,
        issuer,
        statementStartDay,
        isMonthlyStatement,
        rewardRules: isEditing && currentMethod ? currentMethod.rewardRules : [],
        icon: type === 'credit_card' ? 'credit-card' : 'banknote',
        color: type === 'credit_card' ? '#3b82f6' : '#22c55e',
        imageUrl: isEditing && currentMethod ? currentMethod.imageUrl : undefined,
      };
      
      // Update payment methods
      let updatedMethods: PaymentMethod[];
      
      if (isEditing && currentMethod) {
        updatedMethods = paymentMethods.map(method => 
          method.id === currentMethod.id ? paymentMethod : method
        );
      } else {
        updatedMethods = [...paymentMethods, paymentMethod];
      }
      
      setPaymentMethods(updatedMethods);
      await savePaymentMethods(updatedMethods);
      
      toast({
        title: isEditing ? 'Payment Method Updated' : 'Payment Method Added',
        description: `${name} has been ${isEditing ? 'updated' : 'added'} successfully`,
      });
      
      handleDialogClose();
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

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!currentMethod) return;
    
    try {
      setIsUploading(true);
      
      // Upload the image and get the URL
      const imageUrl = await uploadCardImage(file, currentMethod.id);
      
      if (!imageUrl) {
        toast({
          title: 'Upload Failed',
          description: 'Could not upload the image. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      // Update the payment method with the new image URL
      const updatedMethods = paymentMethods.map(method => 
        method.id === currentMethod.id 
          ? { ...method, imageUrl } 
          : method
      );
      
      setPaymentMethods(updatedMethods);
      await savePaymentMethods(updatedMethods);
      
      toast({
        title: 'Image Uploaded',
        description: 'Card image has been updated successfully',
      });
      
      setIsImageDialogOpen(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Group payment methods by type
  const creditCards = paymentMethods.filter(method => method.type === 'credit_card');
  const cashMethods = paymentMethods.filter(method => method.type === 'cash');
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-4xl mx-auto pt-24 pb-20 px-4 sm:px-6">
          <div className="animate-pulse-slow flex items-center justify-center py-12">
            Loading payment methods...
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-4xl mx-auto pt-24 pb-20 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
            <p className="text-muted-foreground mt-1">
              Manage your payment methods and rewards
            </p>
          </div>
          
          <Button 
            className="mt-4 sm:mt-0 gap-2" 
            onClick={openAddDialog}
          >
            <PlusCircleIcon className="h-4 w-4" />
            Add Method
          </Button>
        </div>
        
        <Tabs defaultValue="credit_cards" className="mb-10">
          <TabsList className="mb-4">
            <TabsTrigger value="credit_cards" className="gap-2">
              <CreditCardIcon className="h-4 w-4" />
              Credit Cards
            </TabsTrigger>
            <TabsTrigger value="cash" className="gap-2">
              <BanknoteIcon className="h-4 w-4" />
              Cash
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="credit_cards">
            {creditCards.length === 0 ? (
              <EmptyPaymentMethodsCard 
                type="credit_cards" 
                onAddClick={openAddDialog} 
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {creditCards.map((method) => (
                  <PaymentMethodCard 
                    key={method.id}
                    method={method}
                    onToggleActive={toggleActiveStatus}
                    onEdit={openEditDialog}
                    onImageUpload={openImageDialog}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="cash">
            {cashMethods.length === 0 ? (
              <EmptyPaymentMethodsCard 
                type="cash" 
                onAddClick={openAddDialog} 
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {cashMethods.map((method) => (
                  <PaymentMethodCard 
                    key={method.id}
                    method={method}
                    onToggleActive={toggleActiveStatus}
                    onEdit={openEditDialog}
                    onImageUpload={openImageDialog}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <PaymentMethodForm
            currentMethod={currentMethod}
            isEditing={isEditing}
            isLoading={isLoading}
            onClose={handleDialogClose}
            onSubmit={handleSubmit}
          />
        </Dialog>

        <ImageUploadDialog
          open={isImageDialogOpen}
          onOpenChange={setIsImageDialogOpen}
          paymentMethod={currentMethod}
          onImageUpload={handleImageUpload}
          isUploading={isUploading}
        />
      </main>
    </div>
  );
};

export default PaymentMethods;
