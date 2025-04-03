
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rule } from '@/services/RuleService';
import { RuleCondition, RuleReward } from '@/services/calculators/BaseCalculator';

interface RuleEditorProps {
  rule?: Rule;
  cardType: string;
  onSave: (rule: { name: string; description: string; cardType: string; enabled: boolean; condition: RuleCondition; reward: RuleReward }) => void;
  onCancel: () => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({
  rule,
  cardType,
  onSave,
  onCancel
}) => {
  // Rule metadata
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [enabled, setEnabled] = useState(rule?.enabled !== false);
  
  // Condition state
  const [conditionType, setConditionType] = useState<'mcc' | 'online' | 'contactless' | 'foreign' | 'merchant'>(
    rule?.condition.isOnlineOnly ? 'online' :
    rule?.condition.isContactlessOnly ? 'contactless' :
    rule?.condition.foreignCurrencyOnly ? 'foreign' :
    rule?.condition.merchantNames ? 'merchant' : 'mcc'
  );
  
  const [mccCodes, setMccCodes] = useState<string[]>(rule?.condition.mccCodes || []);
  const [excludedMccCodes, setExcludedMccCodes] = useState<string[]>(rule?.condition.excludedMccCodes || []);
  const [merchantNames, setMerchantNames] = useState<string[]>(rule?.condition.merchantNames || []);
  const [minAmount, setMinAmount] = useState<number | undefined>(rule?.condition.minAmount);
  const [maxAmount, setMaxAmount] = useState<number | undefined>(rule?.condition.maxAmount);
  
  // Reward state
  const [basePointRate, setBasePointRate] = useState(rule?.reward.basePointRate || 1);
  const [bonusPointRate, setBonusPointRate] = useState(rule?.reward.bonusPointRate || 0);
  const [monthlyCap, setMonthlyCap] = useState<number | undefined>(rule?.reward.monthlyCap);
  
  // MCC code input state
  const [newMcc, setNewMcc] = useState('');
  
  // Merchant name input state
  const [newMerchant, setNewMerchant] = useState('');
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create condition based on selected type
    const condition: RuleCondition = {};
    
    switch (conditionType) {
      case 'mcc':
        condition.mccCodes = mccCodes;
        condition.excludedMccCodes = excludedMccCodes.length > 0 ? excludedMccCodes : undefined;
        break;
      case 'online':
        condition.isOnlineOnly = true;
        break;
      case 'contactless':
        condition.isContactlessOnly = true;
        break;
      case 'foreign':
        condition.foreignCurrencyOnly = true;
        break;
      case 'merchant':
        condition.merchantNames = merchantNames;
        break;
    }
    
    // Add amount constraints if provided
    if (minAmount !== undefined) {
      condition.minAmount = minAmount;
    }
    
    if (maxAmount !== undefined) {
      condition.maxAmount = maxAmount;
    }
    
    // Create reward
    const reward: RuleReward = {
      basePointRate,
      bonusPointRate,
      monthlyCap: monthlyCap !== undefined ? monthlyCap : undefined
    };
    
    // Save the rule
    onSave({
      name,
      description,
      cardType,
      enabled,
      condition,
      reward
    });
  };
  
  // Add MCC code
  const handleAddMcc = () => {
    if (newMcc && !mccCodes.includes(newMcc)) {
      setMccCodes([...mccCodes, newMcc]);
      setNewMcc('');
    }
  };
  
  // Remove MCC code
  const handleRemoveMcc = (mcc: string) => {
    setMccCodes(mccCodes.filter(code => code !== mcc));
  };
  
  // Add excluded MCC code
  const handleAddExcludedMcc = () => {
    if (newMcc && !excludedMccCodes.includes(newMcc)) {
      setExcludedMccCodes([...excludedMccCodes, newMcc]);
      setNewMcc('');
    }
  };
  
  // Remove excluded MCC code
  const handleRemoveExcludedMcc = (mcc: string) => {
    setExcludedMccCodes(excludedMccCodes.filter(code => code !== mcc));
  };
  
  // Add merchant name
  const handleAddMerchant = () => {
    if (newMerchant && !merchantNames.includes(newMerchant)) {
      setMerchantNames([...merchantNames, newMerchant]);
      setNewMerchant('');
    }
  };
  
  // Remove merchant name
  const handleRemoveMerchant = (merchant: string) => {
    setMerchantNames(merchantNames.filter(name => name !== merchant));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{rule ? 'Edit Rule' : 'Create Rule'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rule metadata */}
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="E.g., Dining Bonus Points"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="E.g., Extra points for dining transactions"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="enabled" 
              checked={enabled} 
              onCheckedChange={setEnabled}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>
          
          {/* Rule configuration tabs */}
          <Tabs defaultValue="condition" className="mt-6">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="condition">Conditions</TabsTrigger>
              <TabsTrigger value="reward">Rewards</TabsTrigger>
            </TabsList>
            
            <TabsContent value="condition" className="space-y-4">
              {/* Condition type selector */}
              <div className="space-y-2">
                <Label htmlFor="condition-type">Condition Type</Label>
                <Select 
                  value={conditionType} 
                  onValueChange={(value) => setConditionType(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcc">MCC Codes</SelectItem>
                    <SelectItem value="online">Online Transactions</SelectItem>
                    <SelectItem value="contactless">Contactless Payments</SelectItem>
                    <SelectItem value="foreign">Foreign Currency</SelectItem>
                    <SelectItem value="merchant">Merchant Names</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Condition-specific inputs */}
              {conditionType === 'mcc' && (
                <div className="space-y-4">
                  {/* MCC code input */}
                  <div className="space-y-2">
                    <Label htmlFor="mcc">MCC Code</Label>
                    <div className="flex space-x-2">
                      <Input 
                        id="mcc" 
                        value={newMcc} 
                        onChange={e => setNewMcc(e.target.value)} 
                        placeholder="E.g., 5812"
                      />
                      <Button type="button" onClick={handleAddMcc}>Include</Button>
                      <Button type="button" onClick={handleAddExcludedMcc} variant="outline">Exclude</Button>
                    </div>
                  </div>
                  
                  {/* Included MCC codes */}
                  {mccCodes.length > 0 && (
                    <div className="space-y-2">
                      <Label>Included MCC Codes</Label>
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                        {mccCodes.map(mcc => (
                          <div 
                            key={mcc}
                            className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full flex items-center"
                          >
                            <span>{mcc}</span>
                            <button 
                              type="button" 
                              className="ml-1.5 text-green-600 hover:text-green-800"
                              onClick={() => handleRemoveMcc(mcc)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Excluded MCC codes */}
                  {excludedMccCodes.length > 0 && (
                    <div className="space-y-2">
                      <Label>Excluded MCC Codes</Label>
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                        {excludedMccCodes.map(mcc => (
                          <div 
                            key={mcc}
                            className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full flex items-center"
                          >
                            <span>{mcc}</span>
                            <button 
                              type="button" 
                              className="ml-1.5 text-red-600 hover:text-red-800"
                              onClick={() => handleRemoveExcludedMcc(mcc)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {conditionType === 'merchant' && (
                <div className="space-y-4">
                  {/* Merchant name input */}
                  <div className="space-y-2">
                    <Label htmlFor="merchant">Merchant Name</Label>
                    <div className="flex space-x-2">
                      <Input 
                        id="merchant" 
                        value={newMerchant} 
                        onChange={e => setNewMerchant(e.target.value)} 
                        placeholder="E.g., Starbucks"
                      />
                      <Button type="button" onClick={handleAddMerchant}>Add</Button>
                    </div>
                  </div>
                  
                  {/* Merchant names */}
                  {merchantNames.length > 0 && (
                    <div className="space-y-2">
                      <Label>Merchant Names</Label>
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                        {merchantNames.map(merchant => (
                          <div 
                            key={merchant}
                            className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full flex items-center"
                          >
                            <span>{merchant}</span>
                            <button 
                              type="button" 
                              className="ml-1.5 text-blue-600 hover:text-blue-800"
                              onClick={() => handleRemoveMerchant(merchant)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Amount constraints */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="min-amount">Minimum Amount</Label>
                  <Input 
                    id="min-amount" 
                    type="number" 
                    value={minAmount || ''} 
                    onChange={e => setMinAmount(e.target.value ? Number(e.target.value) : undefined)} 
                    placeholder="Optional"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-amount">Maximum Amount</Label>
                  <Input 
                    id="max-amount" 
                    type="number" 
                    value={maxAmount || ''} 
                    onChange={e => setMaxAmount(e.target.value ? Number(e.target.value) : undefined)} 
                    placeholder="Optional"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reward" className="space-y-4">
              {/* Base point rate */}
              <div className="space-y-2">
                <Label htmlFor="base-rate">Base Point Rate (per $1)</Label>
                <Input 
                  id="base-rate" 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={basePointRate} 
                  onChange={e => setBasePointRate(Number(e.target.value))} 
                  required
                />
              </div>
              
              {/* Bonus point rate */}
              <div className="space-y-2">
                <Label htmlFor="bonus-rate">Bonus Point Rate (per $1)</Label>
                <Input 
                  id="bonus-rate" 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={bonusPointRate} 
                  onChange={e => setBonusPointRate(Number(e.target.value))} 
                />
              </div>
              
              {/* Monthly cap */}
              <div className="space-y-2">
                <Label htmlFor="monthly-cap">Monthly Cap (Points)</Label>
                <Input 
                  id="monthly-cap" 
                  type="number" 
                  value={monthlyCap || ''} 
                  onChange={e => setMonthlyCap(e.target.value ? Number(e.target.value) : undefined)} 
                  placeholder="Optional"
                />
              </div>
              
              {/* Point rate preview */}
              <div className="bg-gray-50 p-4 rounded-md space-y-2 mt-4">
                <Label>Total Point Rate Preview</Label>
                <div className="text-2xl font-bold">
                  {(basePointRate + bonusPointRate).toFixed(2)}x
                </div>
                <div className="text-sm text-gray-500">
                  Base: {basePointRate.toFixed(2)}x + Bonus: {bonusPointRate.toFixed(2)}x
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Form actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  );
};

export default RuleEditor;
