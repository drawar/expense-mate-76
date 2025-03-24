
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, CreditCard, Receipt, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/components/theme/theme-provider';
import { ThemeToggle } from '@/components/theme/theme-toggle';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme } = useTheme();

  const links = [
    { to: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/add-expense', icon: <Plus size={20} />, label: 'Add Expense' },
    { to: '/payment-methods', icon: <CreditCard size={20} />, label: 'Payment Methods' },
    { to: '/transactions', icon: <Receipt size={20} />, label: 'Transactions' },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
                location.pathname === link.to
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

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={toggleMenu}
            className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-background border-b border-border transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-y-0 animate-enter shadow-md' : '-translate-y-full animate-exit'
        }`}
      >
        <div className="container mx-auto px-4 py-3 space-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center p-3 rounded-md transition-colors ${
                location.pathname === link.to
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.icon}
              <span className="ml-3">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
