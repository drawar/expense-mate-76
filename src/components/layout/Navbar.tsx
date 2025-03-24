
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, CreditCard, Receipt, Menu, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/components/theme/theme-provider';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  const links = [
    { to: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/add-expense', icon: <Plus size={20} />, label: 'Add Expense' },
    { to: '/payment-methods', icon: <CreditCard size={20} />, label: 'Payment Methods' },
    { to: '/transactions', icon: <Receipt size={20} />, label: 'Transactions' },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-lg md:text-xl font-bold text-gradient">CreditPoints</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center px-3 py-2 rounded-full transition-colors ${
                isActive(link.to)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {link.icon}
              <span className="ml-2">{link.label}</span>
            </Link>
          ))}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Navigation with Dropdown */}
        <div className="flex items-center space-x-2 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <Menu size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] bg-background border-border">
              {links.map((link) => (
                <DropdownMenuItem key={link.to} asChild>
                  <Link 
                    to={link.to} 
                    className={`w-full flex items-center ${
                      isActive(link.to) ? 'bg-accent/50' : ''
                    }`}
                  >
                    {link.icon}
                    <span className="ml-2">{link.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </div>

      {/* Remove old Mobile Menu */}
    </nav>
  );
};

export default Navbar;
