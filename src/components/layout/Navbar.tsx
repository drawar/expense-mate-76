
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { 
  HomeIcon, 
  CoinsIcon, 
  CreditCardIcon, 
  PlusCircleIcon, 
  FileTextIcon,
  Menu
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon size={20} /> },
    { path: '/transactions', label: 'Transactions', icon: <FileTextIcon size={20} /> },
    { path: '/reward-points', label: 'Reward Points', icon: <CoinsIcon size={20} /> },
    { path: '/payment-methods', label: 'Payment Methods', icon: <CreditCardIcon size={20} /> },
  ];

  const renderMobileMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu size={24} />
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-background border-border">
        {navItems.map((item) => (
          <DropdownMenuItem key={item.path} asChild>
            <Link 
              to={item.path} 
              className={`flex items-center gap-2 w-full ${isActive(item.path) ? 'font-medium' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderDesktopNav = () => (
    <div className="hidden md:flex gap-1">
      {navItems.map((item) => (
        <Link key={item.path} to={item.path}>
          <Button 
            variant={isActive(item.path) ? "default" : "ghost"} 
            className="flex gap-2 items-center"
          >
            {item.icon}
            <span>{item.label}</span>
          </Button>
        </Link>
      ))}
    </div>
  );

  return (
    <nav className="p-4 border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex-1 flex items-center gap-2">
          <Link to="/" className="text-xl font-bold mr-4">
            Expense Tracker
          </Link>
          {renderMobileMenu()}
          {renderDesktopNav()}
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
