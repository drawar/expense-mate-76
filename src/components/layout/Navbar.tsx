
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  HomeIcon, 
  PlusCircleIcon, 
  CreditCardIcon, 
  HistoryIcon, 
  MenuIcon, 
  XIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
    { path: '/add-expense', label: 'Add Expense', icon: <PlusCircleIcon className="h-5 w-5" /> },
    { path: '/payment-methods', label: 'Payment Methods', icon: <CreditCardIcon className="h-5 w-5" /> },
    { path: '/transactions', label: 'Transactions', icon: <HistoryIcon className="h-5 w-5" /> },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-white/80 backdrop-blur-md shadow-sm dark:bg-black/80" : "bg-transparent"
    )}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-2 text-white">
            <CreditCardIcon className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg">ExpenseTracker</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={cn(
                "px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200",
                isActive(item.path) 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "hover:bg-secondary"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-black p-4 shadow-lg animate-fade-in border-t border-gray-200 dark:border-gray-800">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-secondary"
                )}
                onClick={closeMobileMenu}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
