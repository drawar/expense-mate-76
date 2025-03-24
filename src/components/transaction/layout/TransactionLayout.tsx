
import { ReactNode } from 'react';
import Navbar from '@/components/layout/Navbar';

interface TransactionLayoutProps {
  children: ReactNode;
}

const TransactionLayout = ({ children }: TransactionLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-6xl mx-auto pt-24 pb-20 px-4 sm:px-6">
        {children}
      </main>
    </div>
  );
};

export default TransactionLayout;
