import React from "react";
import Navbar from "./Navbar";
import { usePaymentReminder } from "@/hooks/usePaymentReminder";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Trigger payment reminder check on app load (runs once per session)
  usePaymentReminder();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-4">{children}</main>
    </div>
  );
};

export default MainLayout;
