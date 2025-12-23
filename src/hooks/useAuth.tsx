import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  startPeriodicSync,
  stopPeriodicSync,
} from "@/utils/syncLocalStorageToSupabase";
import { queryClient } from "@/App";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Start periodic sync when user signs in
      if (event === "SIGNED_IN" && session?.user) {
        setTimeout(() => {
          startPeriodicSync(session.user.id);
        }, 0);
      }

      // Stop periodic sync when user signs out
      if (event === "SIGNED_OUT") {
        stopPeriodicSync();
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Start periodic sync if user is already logged in
      if (session?.user) {
        setTimeout(() => {
          startPeriodicSync(session.user.id);
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
      stopPeriodicSync();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }

    // Clear all user data from localStorage to prevent data leakage between users
    // Note: We preserve UI preferences like theme settings
    const userDataKeys = [
      "expense-tracker-payment-methods",
      "paymentMethods", // legacy key
      "transactions",
      "expense_tracker_transactions",
      "expense-tracker-budgets",
      "clairo-monthly-budget", // legacy budget key
    ];

    userDataKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Clear React Query cache to prevent cached data from being shown to next user
    queryClient.clear();

    console.log("User data and query cache cleared after logout");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
