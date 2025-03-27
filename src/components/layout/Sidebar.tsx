import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect } from 'react';
import { 
  HomeIcon, 
  FileTextIcon, 
  CoinsIcon, 
  CreditCardIcon, 
  PlusCircleIcon,
  ActivityIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

const Sidebar = ({ expanded, onToggle }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Auto collapse sidebar on mobile devices when page loads
  useEffect(() => {
    if (isMobile && expanded) {
      onToggle();
    }
  }, [isMobile]);

  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon size={20} /> },
    { path: '/transactions', label: 'Transactions', icon: <FileTextIcon size={20} /> },
    { path: '/reward-points', label: 'Reward Points', icon: <CoinsIcon size={20} /> },
    { path: '/payment-methods', label: 'Payment Methods', icon: <CreditCardIcon size={20} /> },
    { path: '/add-expense', label: 'Add Expense', icon: <PlusCircleIcon size={20} /> },
  ];

  return (
    <>
      {/* Mobile overlay for closing sidebar when expanded */}
      {isMobile && expanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-10"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      
      <aside className={cn(
        'fixed left-0 top-0 h-screen z-20 bg-[#111827] text-white transition-all duration-300 border-r border-[#1e293b]',
        expanded ? 'w-48' : (isMobile ? 'w-16' : 'w-20')
      )}>
      {/* Logo - clickable to toggle sidebar */}
      <div 
        className="flex items-center justify-center h-16 border-b border-[#1e293b] cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center">
          <ActivityIcon size={24} className="text-[#6366f1]" />
          {expanded && (
            <span className="ml-2 font-semibold text-white">ExpenseMate</span>
          )}
        </div>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-1 py-6 px-2 md:px-3">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center px-3 py-3 rounded-md transition-colors',
                isActive(item.path)
                  ? 'bg-[#1f2937] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1f2937]',
                expanded ? 'justify-start' : 'justify-center'
              )}
            >
              <div className={cn(
                expanded ? 'mr-3' : '',
                'min-w-5 flex items-center justify-center'
              )}>
                {item.icon}
              </div>
              {expanded && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;