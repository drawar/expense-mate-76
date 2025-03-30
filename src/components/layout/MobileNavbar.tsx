
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, FileTextIcon, CoinsIcon, CreditCardIcon, PlusCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileNavbar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon size={20} /> },
    { path: '/transactions', label: 'Transactions', icon: <FileTextIcon size={20} /> },
    { path: '/add-expense', label: 'Add', icon: <PlusCircleIcon size={20} className="text-white" /> },
    { path: '/reward-points', label: 'Points', icon: <CoinsIcon size={20} /> },
    { path: '/payment-methods', label: 'Cards', icon: <CreditCardIcon size={20} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex justify-between items-center h-16">
        {navItems.map((item) => {
          const isAddButton = item.path === '/add-expense';
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 relative",
                isActive(item.path) ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {isAddButton ? (
                <div className="bg-primary rounded-full p-3 -mt-5">
                  {item.icon}
                </div>
              ) : (
                <div className={cn(
                  "p-1",
                  isActive(item.path) && "text-primary"
                )}>
                  {item.icon}
                </div>
              )}
              <span className={cn(
                "text-xs mt-1",
                isActive(item.path) && "text-primary font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavbar;
