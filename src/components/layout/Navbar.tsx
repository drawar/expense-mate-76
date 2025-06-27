
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/theme-toggle';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
              Expense Tracker
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/transactions"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/transactions') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Transactions
              </Link>
              <Link
                to="/add-expense"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/add-expense') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Add Expense
              </Link>
              <Link
                to="/payment-methods"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/payment-methods') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Payment Methods
              </Link>
              <Link
                to="/reward-points"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/reward-points') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Reward Points
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
