// src/components/dashboard/DashboardHeader.tsx
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardHeaderProps {
  isMobile: boolean;
}

/**
 * Component that displays the dashboard header with title and actions
 */
class DashboardHeaderComponent extends Component<DashboardHeaderProps> {
  render() {
    const { isMobile } = this.props;
    
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">
            Expense Tracker
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Track and manage your expenses
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <ThemeToggle />
          <Link to="/add-expense">
            <Button className={`btn-hover-effect bg-gradient-to-r from-[#6366f1] to-[#a855f7] ${!isMobile ? 'gap-2' : 'w-10 h-10 p-0'}`}>
              <PlusCircleIcon className="h-4 w-4" />
              {!isMobile && <span>Add Expense</span>}
            </Button>
          </Link>
        </div>
      </div>
    );
  }
}

/**
 * Higher-order component to provide isMobile to the class component
 */
const DashboardHeader = () => {
  const isMobile = useIsMobile();
  
  return <DashboardHeaderComponent isMobile={isMobile} />;
};

export default DashboardHeader;
