import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

export interface RewardRuleFormData {
  id?: string;
  name: string;
  description: string;
  enabled: boolean;
  basePointRate: number;
  bonusPointRate: number;
  monthlyCap: number;
  isOnlineOnly: boolean;
  isContactlessOnly: boolean;
  includedMCCs: string[];
  excludedMCCs: string[];
}

interface RewardRuleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<RewardRuleFormData>;
  onSave: (data: RewardRuleFormData) => void;
  title?: string;
}

const defaultFormData: RewardRuleFormData = {
  name: '',
  description: '',
  enabled: true,
  basePointRate: 0.4,
  bonusPointRate: 0,
  monthlyCap: 0,
  isOnlineOnly: false,
  isContactlessOnly: false,
  includedMCCs: [],
  excludedMCCs: []
};

const RewardRuleEditDialog: React.FC<RewardRuleEditDialogProps> = ({
  open,
  onOpenChange,
  initialData,
  onSave,
  title = 'Edit Reward Rule'
}) => {
  const [formData, setFormData] = useState<RewardRuleFormData>({
    ...defaultFormData,
    ...initialData
  });
  const [newMCC, setNewMCC] = useState('');
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) || 0 }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleMCCAdd = () => {
    if (newMCC.trim() && !formData.includedMCCs.includes(newMCC.trim())) {
      setFormData(prev => ({
        ...prev,
        includedMCCs: [...prev.includedMCCs, newMCC.trim()]
      }));
      setNewMCC('');
    }
  };

  const handleMCCRemove = (mcc: string) => {
    setFormData(prev => ({
      ...prev,
      includedMCCs: prev.includedMCCs.filter(m => m !== mcc)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Rule name is required",
        variant: "destructive"
      });
      return;
    }
    
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Rule Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1.5 bg-white border-gray-300 font-medium"
                style={{ color: '#000000' }}
                placeholder="e.g. Grocery Bonus"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1.5 bg-white border-gray-300 font-medium"
                style={{ color: '#000000' }}
                placeholder="e.g. 6% back at U.S. supermarkets"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => handleCheckboxChange('enabled', checked as boolean)}
              />
              <Label htmlFor="enabled" className="text-white">Enabled</Label>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Points Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="basePointRate" className="text-white">
                  Base Point Rate (per $1)
                </Label>
                <Input
                  id="basePointRate"
                  name="basePointRate"
                  type="number"
                  step="0.1"
                  value={formData.basePointRate}
                  onChange={handleNumberChange}
                  className="mt-1.5 bg-white border-gray-300 font-medium"
                  style={{ color: '#000000' }}
                />
              </div>
              
              <div>
                <Label htmlFor="bonusPointRate" className="text-white">
                  Bonus Point Rate (per $1)
                </Label>
                <Input
                  id="bonusPointRate"
                  name="bonusPointRate"
                  type="number"
                  step="0.1"
                  value={formData.bonusPointRate}
                  onChange={handleNumberChange}
                  className="mt-1.5 bg-white border-gray-300 font-medium"
                  style={{ color: '#000000' }}
                />
              </div>
              
              <div>
                <Label htmlFor="monthlyCap" className="text-white">
                  Monthly Bonus Points Cap
                </Label>
                <Input
                  id="monthlyCap"
                  name="monthlyCap"
                  type="number"
                  value={formData.monthlyCap}
                  onChange={handleNumberChange}
                  className="mt-1.5 bg-white border-gray-300 font-medium"
                  style={{ color: '#000000' }}
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Eligibility Criteria</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isOnlineOnly"
                  checked={formData.isOnlineOnly}
                  onCheckedChange={(checked) => handleCheckboxChange('isOnlineOnly', checked as boolean)}
                />
                <Label htmlFor="isOnlineOnly" className="text-white">Online Transactions Only</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isContactlessOnly"
                  checked={formData.isContactlessOnly}
                  onCheckedChange={(checked) => handleCheckboxChange('isContactlessOnly', checked as boolean)}
                />
                <Label htmlFor="isContactlessOnly" className="text-white">Contactless Payments Only</Label>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Merchant Category Codes (MCCs)</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  id="newMCC"
                  value={newMCC}
                  onChange={(e) => setNewMCC(e.target.value)}
                  className="bg-white border-gray-300 font-medium"
                  style={{ color: '#000000' }}
                  placeholder="Enter MCC code"
                />
                <Button 
                  type="button" 
                  onClick={handleMCCAdd}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              
              {formData.includedMCCs.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.includedMCCs.map(mcc => (
                    <div 
                      key={mcc} 
                      className="bg-blue-900 text-white text-xs rounded-full px-2.5 py-1 flex items-center"
                    >
                      <span>{mcc}</span>
                      <button
                        type="button"
                        className="ml-1.5 text-white/70 hover:text-white"
                        onClick={() => handleMCCRemove(mcc)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No MCCs added yet</p>
              )}
            </div>
          </div>
          
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-700 text-white"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RewardRuleEditDialog;