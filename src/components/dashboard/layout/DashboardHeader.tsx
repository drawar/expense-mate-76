// components/dashboard/layout/DashboardHeader.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * Component that displays the dashboard header with title and actions
 */
const DashboardHeader: React.FC = () => {
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-10 mt-4">
      <div className="mb-4 sm:mb-0">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">
          Expense Tracker
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Track and manage your expenses
        </p>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link to="/add-expense">
          <Button
            className={`btn-hover-effect bg-primary hover:bg-primary/90 ${!isMobile ? "gap-2" : "w-10 h-10 p-0"}`}
          >
            <PlusCircleIcon className="h-4 w-4" />
            {!isMobile && <span>Add Expense</span>}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default React.memo(DashboardHeader);
