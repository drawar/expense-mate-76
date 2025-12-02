import { ConversionRateManager } from "@/components/settings";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

/**
 * Settings page for managing application configuration
 */
export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your application settings and preferences
              </p>
            </div>

            <ConversionRateManager />
          </div>
        </main>
      </div>
    </div>
  );
}
