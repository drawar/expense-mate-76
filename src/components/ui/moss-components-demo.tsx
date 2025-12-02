/**
 * Moss Components Demo
 * 
 * This file demonstrates how to use the new Moss Dark UI components:
 * - CollapsibleSection: For progressive disclosure patterns
 * - MossCard: For consistent card styling
 * - MossInput: For form inputs with Moss Dark theme
 * 
 * Example usage in forms:
 */

import * as React from 'react';
import { CollapsibleSection } from './collapsible-section';
import { MossCard } from './moss-card';
import { MossInput } from './moss-input';

export const MossComponentsDemo: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Example 1: Basic Card */}
      <MossCard>
        <h2 className="text-section-header mb-4">Basic Card Example</h2>
        <p className="text-body">
          This is a basic MossCard component with design token styling.
        </p>
      </MossCard>

      {/* Example 2: Card with Hover Effect */}
      <MossCard hover={true}>
        <h2 className="text-section-header mb-4">Hoverable Card</h2>
        <p className="text-body">
          This card has a hover effect enabled (desktop only).
        </p>
      </MossCard>

      {/* Example 3: Card with Form Inputs */}
      <MossCard>
        <h2 className="text-section-header mb-4">Form Example</h2>
        <div className="space-y-4">
          <div>
            <label className="text-label block mb-2">Name</label>
            <MossInput placeholder="Enter your name" />
          </div>
          <div>
            <label className="text-label block mb-2">Email</label>
            <MossInput type="email" placeholder="Enter your email" />
          </div>
        </div>
      </MossCard>

      {/* Example 4: Progressive Disclosure */}
      <MossCard>
        <h2 className="text-section-header mb-4">Progressive Disclosure Example</h2>
        
        {/* Always visible fields */}
        <div className="space-y-4">
          <div>
            <label className="text-label block mb-2">Essential Field</label>
            <MossInput placeholder="This is always visible" />
          </div>
        </div>

        {/* Collapsible advanced fields */}
        <CollapsibleSection 
          trigger="Show advanced fields"
          id="demo-advanced"
          persistState={true}
        >
          <div className="space-y-4">
            <div>
              <label className="text-label block mb-2">Advanced Field 1</label>
              <MossInput placeholder="This is hidden by default" />
            </div>
            <div>
              <label className="text-label block mb-2">Advanced Field 2</label>
              <MossInput placeholder="Another optional field" />
            </div>
          </div>
        </CollapsibleSection>
      </MossCard>

      {/* Example 5: Nested Collapsible Sections */}
      <MossCard>
        <h2 className="text-section-header mb-4">Nested Sections Example</h2>
        
        <CollapsibleSection 
          trigger="Show merchant details"
          id="demo-merchant"
        >
          <div className="space-y-4">
            <div>
              <label className="text-label block mb-2">Merchant Name</label>
              <MossInput placeholder="Enter merchant name" />
            </div>
            
            <CollapsibleSection 
              trigger="Add more merchant details"
              id="demo-merchant-extra"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-label block mb-2">Merchant Address</label>
                  <MossInput placeholder="Enter address" />
                </div>
                <div>
                  <label className="text-label block mb-2">Notes</label>
                  <MossInput placeholder="Additional notes" />
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </CollapsibleSection>
      </MossCard>
    </div>
  );
};
