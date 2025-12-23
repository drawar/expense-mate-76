import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Menu,
  X,
  HomeIcon,
  FileTextIcon,
  CoinsIcon,
  CreditCardIcon,
  PlusCircleIcon,
  ActivityIcon,
  SettingsIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ClairoLogo } from "@/components/ui/clairo-logo";

const navItems = [
  { path: "/", label: "Dashboard", icon: HomeIcon },
  { path: "/transactions", label: "Transactions", icon: FileTextIcon },
  { path: "/add-expense", label: "Add Expense", icon: PlusCircleIcon },
  { path: "/payment-methods", label: "Payment Methods", icon: CreditCardIcon },
  { path: "/reward-points", label: "Reward Points", icon: CoinsIcon },
  { path: "/card-optimizer", label: "Card Optimizer", icon: ActivityIcon },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Force re-render key to fix Safari iOS rendering bug when waking from sleep
  const [renderKey, setRenderKey] = useState(0);

  // Handle visibility change to fix Safari iOS backdrop-filter rendering bug
  // When the screen turns off and back on, Safari can corrupt the rendering
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Force a re-render to fix corrupted backdrop-filter rendering
        setRenderKey((k) => k + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <>
      <nav key={renderKey} className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Desktop Nav */}
            <div className="flex items-center space-x-8">
              <Link to="/">
                <ClairoLogo size={28} showText />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive(item.path)
                        ? "bg-[#7C9885]/15 text-[#7C9885]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="hidden sm:flex"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Sign out</span>
                </Button>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive(item.path)
                      ? "bg-[#7C9885]/15 text-[#7C9885]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              ))}

              {/* Sign out button for mobile */}
              {user && (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Backdrop for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
