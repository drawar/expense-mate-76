
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PaymentMethod, Currency, RewardRule } from '@/types';
import { getPaymentMethods, savePaymentMethods } from '@/utils/storageUtils';
import { currencyOptions, getCurrencySymbol } from '@/utils/currencyFormatter';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CreditCardIcon,
  BanknoteIcon,
  PlusCircleIcon,
  EditIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  CoinsIcon,
  CalendarIcon,
  CheckIcon,
  XIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(null);
  const { toast } = useToast();
  
  // Load payment methods
  useEffect(() => {
    const methods = getPaymentMethods();
    setPaymentMethods(methods);
  }, []);
  
  // Toggle payment method active status
  const toggleActiveStatus = (id: string) => {
    const updatedMethods = paymentMethods.map(method => 
      method.id === id ? { ...method, active: !method.active } : method
    );
    
    setPaymentMethods(updatedMethods);
    savePaymentMethods(updatedMethods);
    
    toast({
      title: 'Status Updated',
      description: `Payment method ${updatedMethods.find(m => m.id === id)?.active ? 'activated' : 'deactivated'}`,
    });
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
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setCurrentMethod(null);
      setIsEditing(false);
    }, 300);
  };
  
  // Handle form submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const name = formData.get('name') as string;
    const type = formData.get('type') as 'cash' | 'credit_card';
    const currency = formData.get('currency') as Currency;
    const active = !!formData.get('active');
    
    // Credit card specific fields
    const lastFourDigits = type === 'credit_card' ? formData.get('lastFourDigits') as string : undefined;
    const issuer = type === 'credit_card' ? formData.get('issuer') as string : undefined;
    const statementStartDay = type === 'credit_card' ? Number(formData.get('statementStartDay')) : undefined;
    const isMonthlyStatement = type === 'credit_card' ? formData.get('isMonthlyStatement') === 'on' : undefined;
    
    // Create payment method object
    const paymentMethod: PaymentMethod = {
      id: isEditing && currentMethod ? currentMethod.id : Date.now().toString(),
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
    savePaymentMethods(updatedMethods);
    
    toast({
      title: isEditing ? 'Payment Method Updated' : 'Payment Method Added',
      description: `${name} has been ${isEditing ? 'updated' : 'added'} successfully`,
    });
    
    handleDialogClose();
  };
  
  // Group payment methods by type
  const creditCards = paymentMethods.filter(method => method.type === 'credit_card');
  const cashMethods = paymentMethods.filter(method => method.type === 'cash');
  
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
              <div className="glass-card rounded-xl p-8 text-center">
                <p className="text-muted-foreground mb-4">No credit cards added yet.</p>
                <Button onClick={openAddDialog}>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Add Credit Card
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {creditCards.map((method) => (
                  <Card 
                    key={method.id} 
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      !method.active && "opacity-70"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-2 rounded-full" 
                            style={{ backgroundColor: `${method.color}20` }}
                          >
                            <CreditCardIcon 
                              className="h-5 w-5" 
                              style={{ color: method.color }} 
                            />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{method.name}</CardTitle>
                            <CardDescription>
                              {method.issuer} {method.lastFourDigits && `•••• ${method.lastFourDigits}`}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleActiveStatus(method.id)}
                          >
                            {method.active ? (
                              <ToggleRightIcon className="h-5 w-5 text-green-500" />
                            ) : (
                              <ToggleLeftIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEditDialog(method)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          {method.statementStartDay 
                            ? `Statement Cycle: Day ${method.statementStartDay}` 
                            : 'Calendar Month'}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm mt-1">
                        <CoinsIcon className="h-4 w-4 mr-2 text-amber-500" />
                        <span>
                          {method.rewardRules.length 
                            ? `${method.rewardRules.length} Reward Rules` 
                            : 'No rewards configured'}
                        </span>
                      </div>
                      
                      {method.rewardRules.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {method.rewardRules.slice(0, 2).map((rule) => (
                            <div 
                              key={rule.id} 
                              className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 inline-block mr-2"
                            >
                              {rule.description}
                            </div>
                          ))}
                          {method.rewardRules.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{method.rewardRules.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="cash">
            {cashMethods.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <p className="text-muted-foreground mb-4">No cash payment methods added yet.</p>
                <Button onClick={openAddDialog}>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Add Cash Method
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {cashMethods.map((method) => (
                  <Card 
                    key={method.id} 
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      !method.active && "opacity-70"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-2 rounded-full" 
                            style={{ backgroundColor: `${method.color}20` }}
                          >
                            <BanknoteIcon 
                              className="h-5 w-5" 
                              style={{ color: method.color }} 
                            />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{method.name}</CardTitle>
                            <CardDescription>
                              {method.currency} ({getCurrencySymbol(method.currency)})
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleActiveStatus(method.id)}
                          >
                            {method.active ? (
                              <ToggleRightIcon className="h-5 w-5 text-green-500" />
                            ) : (
                              <ToggleLeftIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEditDialog(method)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Payment Method' : 'Add Payment Method'}
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? 'Update the details of your payment method'
                  : 'Add a new payment method for tracking expenses'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Chase Sapphire"
                    className="col-span-3"
                    defaultValue={currentMethod?.name || ''}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select 
                    name="type" 
                    defaultValue={currentMethod?.type || 'credit_card'}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currency" className="text-right">
                    Currency
                  </Label>
                  <Select 
                    name="currency" 
                    defaultValue={currentMethod?.currency || 'USD'}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {currentMethod?.type === 'credit_card' || !currentMethod ? (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="issuer" className="text-right">
                        Issuer
                      </Label>
                      <Input
                        id="issuer"
                        name="issuer"
                        placeholder="e.g. Chase, Amex"
                        className="col-span-3"
                        defaultValue={currentMethod?.issuer || ''}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="lastFourDigits" className="text-right">
                        Last 4 Digits
                      </Label>
                      <Input
                        id="lastFourDigits"
                        name="lastFourDigits"
                        placeholder="e.g. 1234"
                        className="col-span-3"
                        maxLength={4}
                        defaultValue={currentMethod?.lastFourDigits || ''}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="statementStartDay" className="text-right">
                        Statement Day
                      </Label>
                      <Input
                        id="statementStartDay"
                        name="statementStartDay"
                        type="number"
                        min="1"
                        max="31"
                        placeholder="e.g. 15"
                        className="col-span-3"
                        defaultValue={currentMethod?.statementStartDay?.toString() || ''}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">
                        Statement Type
                      </Label>
                      <div className="col-span-3 flex items-center space-x-2">
                        <Switch
                          id="isMonthlyStatement"
                          name="isMonthlyStatement"
                          defaultChecked={currentMethod?.isMonthlyStatement}
                        />
                        <Label htmlFor="isMonthlyStatement">
                          Use statement month (instead of calendar month)
                        </Label>
                      </div>
                    </div>
                  </>
                ) : null}
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Status
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      id="active"
                      name="active"
                      defaultChecked={currentMethod?.active ?? true}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default PaymentMethods;
