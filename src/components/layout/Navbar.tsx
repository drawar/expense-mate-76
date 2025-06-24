
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
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
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline-block">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
