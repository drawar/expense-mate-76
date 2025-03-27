import React, { useState } from 'react';
import { RewardRule, RewardRuleFactory } from './BaseRewardCard';

/**
 * Interface for user-editable reward rule properties
 */
interface EditableRuleConfig {
  // Basic rule properties
  name: string;
  description: string;
  enabled: boolean;

  // Reward rates
  basePointRate: number;
  bonusPointRate: number;
  monthlyCap: number;

  // Eligibility criteria
  isOnlineOnly: boolean;
  isContactlessOnly: boolean;
  
  // MCC codes
  includedMCCs: string[];
  excludedMCCs: string[];

  // Additional conditions
  minSpend?: number; 
  maxSpend?: number;
  currencyRestrictions?: string[];
}

// Default configuration for a new rule
const defaultRuleConfig: EditableRuleConfig = {
  name: 'New Reward Rule',
  description: 'Configure this rule for your card',
  enabled: true,
  basePointRate: 0.4,
  bonusPointRate: 0,
  monthlyCap: 0,
  isOnlineOnly: false,
  isContactlessOnly: false,
  includedMCCs: [],
  excludedMCCs: []
};

interface RewardRuleEditorProps {
  initialConfig?: EditableRuleConfig;
  onSave: (config: EditableRuleConfig) => void;
  onCancel: () => void;
}

/**
 * Component that allows users to edit reward rules through a UI
 * 
 * This demonstrates how the modular architecture could be exposed to end-users
 * for customization of reward rules.
 */
export const RewardRuleEditor: React.FC<RewardRuleEditorProps> = ({
  initialConfig = defaultRuleConfig,
  onSave,
  onCancel
}) => {
  const [config, setConfig] = useState<EditableRuleConfig>(initialConfig);
  const [newMCC, setNewMCC] = useState<string>('');
  
  // Update a single field in the config
  const updateField = (field: keyof EditableRuleConfig, value: any) => {
    setConfig({
      ...config,
      [field]: value
    });
  };
  
  // Add an MCC code to the inclusion list
  const addIncludedMCC = () => {
    if (newMCC && !config.includedMCCs.includes(newMCC)) {
      updateField('includedMCCs', [...config.includedMCCs, newMCC]);
      setNewMCC('');
    }
  };
  
  // Add an MCC code to the exclusion list
  const addExcludedMCC = () => {
    if (newMCC && !config.excludedMCCs.includes(newMCC)) {
      updateField('excludedMCCs', [...config.excludedMCCs, newMCC]);
      setNewMCC('');
    }
  };
  
  // Remove an MCC code from the inclusion list
  const removeIncludedMCC = (mccToRemove: string) => {
    updateField('includedMCCs', config.includedMCCs.filter(mcc => mcc !== mccToRemove));
  };
  
  // Remove an MCC code from the exclusion list
  const removeExcludedMCC = (mccToRemove: string) => {
    updateField('excludedMCCs', config.excludedMCCs.filter(mcc => mcc !== mccToRemove));
  };
  
  // Convert UI config to actual rule objects (simplified example)
  const generateRules = (config: EditableRuleConfig): RewardRule[] => {
    const rules: RewardRule[] = [];
    
    // Add online transaction rule if enabled
    if (config.isOnlineOnly) {
      rules.push(RewardRuleFactory.createOnlineTransactionRule());
    }
    
    // Add contactless transaction rule if enabled
    if (config.isContactlessOnly) {
      rules.push(RewardRuleFactory.createContactlessTransactionRule());
    }
    
    // Add MCC inclusion rule if MCCs are defined
    if (config.includedMCCs.length > 0) {
      rules.push(RewardRuleFactory.createMCCInclusionRule(config.includedMCCs));
    }
    
    // Add MCC exclusion rule if MCCs are defined
    if (config.excludedMCCs.length > 0) {
      rules.push(RewardRuleFactory.createMCCExclusionRule(config.excludedMCCs));
    }
    
    return rules;
  };
  
  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-lg font-bold mb-4">Edit Reward Rule</h2>
      
      {/* Basic Information */}
      <div className="mb-4">
        <label className="block mb-2">Rule Name</label>
        <input 
          type="text" 
          className="w-full p-2 border rounded" 
          value={config.name} 
          onChange={(e) => updateField('name', e.target.value)} 
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Description</label>
        <textarea 
          className="w-full p-2 border rounded" 
          value={config.description} 
          onChange={(e) => updateField('description', e.target.value)} 
        />
      </div>
      
      <div className="mb-4">
        <label className="flex items-center">
          <input 
            type="checkbox" 
            checked={config.enabled} 
            onChange={(e) => updateField('enabled', e.target.checked)} 
            className="mr-2"
          />
          Enabled
        </label>
      </div>
      
      {/* Points Configuration */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Points Configuration</h3>
        
        <div className="mb-2">
          <label className="block mb-1">Base Point Rate (per $1)</label>
          <input 
            type="number" 
            step="0.1" 
            className="w-full p-2 border rounded" 
            value={config.basePointRate} 
            onChange={(e) => updateField('basePointRate', parseFloat(e.target.value))} 
          />
        </div>
        
        <div className="mb-2">
          <label className="block mb-1">Bonus Point Rate (per $1)</label>
          <input 
            type="number" 
            step="0.1" 
            className="w-full p-2 border rounded" 
            value={config.bonusPointRate} 
            onChange={(e) => updateField('bonusPointRate', parseFloat(e.target.value))} 
          />
        </div>
        
        <div className="mb-2">
          <label className="block mb-1">Monthly Bonus Points Cap</label>
          <input 
            type="number" 
            className="w-full p-2 border rounded" 
            value={config.monthlyCap} 
            onChange={(e) => updateField('monthlyCap', parseInt(e.target.value))} 
          />
        </div>
      </div>
      
      {/* Eligibility Criteria */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Eligibility Criteria</h3>
        
        <div className="mb-2">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={config.isOnlineOnly} 
              onChange={(e) => updateField('isOnlineOnly', e.target.checked)} 
              className="mr-2"
            />
            Online Transactions Only
          </label>
        </div>
        
        <div className="mb-2">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={config.isContactlessOnly} 
              onChange={(e) => updateField('isContactlessOnly', e.target.checked)} 
              className="mr-2"
            />
            Contactless Payments Only
          </label>
        </div>
      </div>
      
      {/* MCC Configuration */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Merchant Category Codes (MCCs)</h3>
        
        <div className="mb-2">
          <label className="block mb-1">Add MCC:</label>
          <div className="flex">
            <input 
              type="text" 
              className="flex-1 p-2 border rounded-l" 
              value={newMCC} 
              onChange={(e) => setNewMCC(e.target.value)}
              placeholder="Enter MCC code"
            />
            <button 
              className="px-3 py-2 bg-green-500 text-white rounded-r"
              onClick={addIncludedMCC}
            >
              Include
            </button>
            <button 
              className="px-3 py-2 ml-2 bg-red-500 text-white rounded"
              onClick={addExcludedMCC}
            >
              Exclude
            </button>
          </div>
        </div>
        
        {/* Included MCCs */}
        {config.includedMCCs.length > 0 && (
          <div className="mb-2">
            <h4 className="text-sm font-medium mb-1">Included MCCs:</h4>
            <div className="flex flex-wrap gap-2">
              {config.includedMCCs.map(mcc => (
                <span
                  key={mcc}
                  className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center"
                >
                  {mcc}
                  <button 
                    className="ml-1 text-red-500"
                    onClick={() => removeIncludedMCC(mcc)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Excluded MCCs */}
        {config.excludedMCCs.length > 0 && (
          <div className="mb-2">
            <h4 className="text-sm font-medium mb-1">Excluded MCCs:</h4>
            <div className="flex flex-wrap gap-2">
              {config.excludedMCCs.map(mcc => (
                <span
                  key={mcc}
                  className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center"
                >
                  {mcc}
                  <button 
                    className="ml-1 text-red-500"
                    onClick={() => removeExcludedMCC(mcc)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Spending Thresholds */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Spending Thresholds (Optional)</h3>
        
        <div className="mb-2">
          <label className="block mb-1">Minimum Spend</label>
          <input 
            type="number" 
            className="w-full p-2 border rounded" 
            value={config.minSpend || ''} 
            onChange={(e) => updateField('minSpend', e.target.value ? parseFloat(e.target.value) : undefined)} 
            placeholder="No minimum"
          />
        </div>
        
        <div className="mb-2">
          <label className="block mb-1">Maximum Spend</label>
          <input 
            type="number" 
            className="w-full p-2 border rounded" 
            value={config.maxSpend || ''} 
            onChange={(e) => updateField('maxSpend', e.target.value ? parseFloat(e.target.value) : undefined)} 
            placeholder="No maximum"
          />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <button 
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => onSave(config)}
        >
          Save Rule
        </button>
      </div>
    </div>
  );
};