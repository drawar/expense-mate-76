
import React, { Component } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

/**
 * Base props interface for all financial insight cards
 */
export interface FinancialInsightCardProps {
  title: string;
  icon?: LucideIcon; // Use LucideIcon type from lucide-react
  className?: string;
}

/**
 * Abstract base class for all financial insight cards
 * Provides consistent structure and styling while allowing
 * subclasses to define their specific content
 */
abstract class AbstractFinancialInsightCard<P extends FinancialInsightCardProps> extends Component<P> {
  /**
   * Abstract method that subclasses must implement to provide card-specific content
   */
  protected abstract renderCardContent(): React.ReactNode;
  
  /**
   * Optional method subclasses can override to provide additional header actions
   */
  protected renderHeaderActions(): React.ReactNode {
    return null;
  }
  
  /**
   * Renders the card with consistent styling and structure
   */
  render() {
    const { title, icon: Icon, className = '' } = this.props;
    
    return (
      <Card className={`rounded-xl border border-border/50 bg-card hover:shadow-md transition-all overflow-hidden ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-primary" />}
              {title}
            </CardTitle>
            {this.renderHeaderActions()}
          </div>
        </CardHeader>
        <CardContent>
          {this.renderCardContent()}
        </CardContent>
      </Card>
    );
  }
}

export default AbstractFinancialInsightCard;
