import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';
import { 
  HomeIcon, 
  FileTextIcon, 
  CoinsIcon, 
  CreditCardIcon, 
  PlusCircleIcon,
  ActivityIcon,
  MenuIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
  sidebarVisible?: boolean;
  setSidebarVisible?: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar = ({ 
  expanded, 
  onToggle, 
  sidebarVisible: externalVisible, 
  setSidebarVisible: setExternalVisible 
}: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  // Internal state that can be overridden by props
  const [internalVisible, setInternalVisible] = useState(false);
  
  // Use either external or internal state
  const sidebarVisible = externalVisible !== undefined ? externalVisible : internalVisible;
  const setSidebarVisible = setExternalVisible || setInternalVisible;
  
  // Auto collapse sidebar on mobile devices when page loads
  useEffect(() => {
    if (isMobile && expanded) {
      onToggle();
    }
    
    // Only set internal state if external state is not provided
    if (externalVisible === undefined) {
      setInternalVisible(!isMobile);
    }
  }, [isMobile, expanded, onToggle, externalVisible]);
  
  // Handle logo click on mobile
  const handleLogoClick = () => {
    if (isMobile) {
      setSidebarVisible(!sidebarVisible);
    } else {
      onToggle();
    }
  };

  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon size={20} /> },
    { path: '/transactions', label: 'Transactions', icon: <FileTextIcon size={20} /> },
    { path: '/reward-points', label: 'Reward Points', icon: <CoinsIcon size={20} /> },
    { path: '/payment-methods', label: 'Payment Methods', icon: <CreditCardIcon size={20} /> },
    { path: '/add-expense', label: 'Add Expense', icon: <PlusCircleIcon size={20} /> },
  ];

  // Render horizontal navbar for mobile
  if (isMobile) {
    return (
      <>
        {/* Horizontal mobile navbar */}
        <div className="fixed top-0 left-0 right-0 z-20 bg-background text-foreground border-b">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Logo */}
            <div className="flex items-center">
              <ActivityIcon size={24} className="text-[#6366f1]" />
              <span className="ml-2 font-semibold">ExpenseMate</span>
            </div>
            
            {/* Menu toggle button */}
            <button 
              className="p-2 rounded-md hover:bg-muted"
              onClick={() => setSidebarVisible(!sidebarVisible)}
            >
              <MenuIcon size={24} />
            </button>
          </div>
          
          {/* Dropdown menu */}
          {sidebarVisible && (
            <div className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg z-30 transition-all duration-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <nav className="py-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center px-4 py-3 transition-colors',
                      isActive(item.path)
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                    onClick={() => setSidebarVisible(false)}
                  >
                    <div className="mr-3 min-w-5 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
        
        {/* Backdrop */}
        {sidebarVisible && (
          <div 
            className="fixed inset-0 bg-black/50 z-10 mt-16"
            onClick={() => setSidebarVisible(false)}
            aria-hidden="true"
          />
        )}
      </>
    );
  }

  // Desktop sidebar (original implementation)
  return (
    <>
      {/* Mobile overlay for closing sidebar when expanded */}
      {isMobile && sidebarVisible && (
        <div 
          className="fixed inset-0 bg-black/50 z-10"
          onClick={() => setSidebarVisible(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile-only logo when sidebar is hidden */}
      {isMobile && !sidebarVisible && (
        <div 
          className="fixed left-0 top-0 z-20 w-12 h-12 m-2 flex items-center justify-center bg-[#111827] rounded-full shadow-lg cursor-pointer"
          onClick={handleLogoClick}
        >
          <ActivityIcon size={24} className="text-[#6366f1]" />
        </div>
      )}
      
      {/* Full sidebar - hidden on mobile unless toggled */}
      <aside className={cn(
        'fixed left-0 top-0 h-screen z-20 bg-[#111827] text-white transition-all duration-300 border-r border-[#1e293b]',
        expanded ? 'w-48' : 'w-20',
        isMobile && !sidebarVisible ? '-translate-x-full' : 'translate-x-0'
      )}>
      {/* Logo - clickable to toggle sidebar */}
      <div 
        className="flex items-center justify-center h-16 border-b border-[#1e293b] cursor-pointer"
        onClick={handleLogoClick}
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
              onClick={() => isMobile && setSidebarVisible(false)}
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