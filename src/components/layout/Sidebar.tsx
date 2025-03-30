
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect } from 'react';
import { 
  HomeIcon, 
  FileTextIcon, 
  CoinsIcon, 
  CreditCardIcon, 
  PlusCircleIcon,
  ActivityIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/theme-toggle';

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

const Sidebar = ({ expanded, onToggle }: SidebarProps) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon size={20} /> },
    { path: '/transactions', label: 'Transactions', icon: <FileTextIcon size={20} /> },
    { path: '/reward-points', label: 'Reward Points', icon: <CoinsIcon size={20} /> },
    { path: '/payment-methods', label: 'Payment Methods', icon: <CreditCardIcon size={20} /> },
    { path: '/add-expense', label: 'Add Expense', icon: <PlusCircleIcon size={20} /> },
  ];

  return (
    <aside className={cn(
      'h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300',
      expanded ? 'w-64' : 'w-20'
    )}>
      {/* Logo and toggle button */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center">
          <ActivityIcon size={24} className="text-primary" />
          {expanded && <span className="ml-2 font-semibold">ExpenseMate</span>}
        </div>
        <button 
          onClick={onToggle} 
          className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
        >
          {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center py-3 px-3 rounded-md transition-colors',
                isActive(item.path)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                !expanded && 'justify-center'
              )}
            >
              <span className={expanded ? 'mr-3' : ''}>{item.icon}</span>
              {expanded && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom section with theme toggle */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
        <div className={cn(
          'flex items-center',
          expanded ? 'justify-between' : 'justify-center'
        )}>
          {expanded && <span className="text-sm text-sidebar-muted-foreground">Theme</span>}
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
