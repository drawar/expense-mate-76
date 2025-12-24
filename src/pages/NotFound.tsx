import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto h-screen flex flex-col items-center justify-center px-4 md:px-6 py-8 -mt-20">
        <div className="glass-card-elevated p-8 md:p-12 rounded-2xl text-center max-w-md mx-auto animate-fade-in">
          <h1 className="text-9xl font-medium text-primary mb-4">404</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Oops! The page you're looking for doesn't exist.
          </p>
          <Link to="/">
            <Button className="gap-2">
              <HomeIcon className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
