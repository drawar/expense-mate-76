
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { HomeIcon, CoinsIcon, CreditCardIcon, PlusCircleIcon, FileTextIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

// Simple mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};

const Navbar = () => {
  const location = useLocation();
  const { isMobile } = useIsMobile();

  const isActive = (path: string) => location.pathname === path;

  const renderNavLink = (path: string, label: string, icon: React.ReactNode) => {
    const variant = isActive(path) ? 'default' : 'ghost';
    
    return (
      <Link to={path}>
        <Button variant={variant} className="flex gap-2 items-center">
          {icon}
          {!isMobile && <span>{label}</span>}
        </Button>
      </Link>
    );
  };

  return (
    <nav className="p-4 border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex-1 flex items-center gap-2">
          <Link to="/" className="text-xl font-bold mr-4">
            Expense Tracker
          </Link>
          <div className="flex gap-1">
            {renderNavLink('/', 'Dashboard', <HomeIcon size={20} />)}
            {renderNavLink('/transactions', 'Transactions', <FileTextIcon size={20} />)}
            {renderNavLink('/reward-points', 'Reward Points', <CoinsIcon size={20} />)}
            {renderNavLink('/payment-methods', 'Payment Methods', <CreditCardIcon size={20} />)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link to="/add-expense">
            <Button className="flex gap-2 items-center">
              <PlusCircleIcon size={20} />
              {!isMobile && <span>Add Expense</span>}
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
