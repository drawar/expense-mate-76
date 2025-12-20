import { ConversionRateManager } from "@/components/settings";

/**
 * Settings page for managing application configuration
 */
export default function Settings() {
  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your application settings and preferences
        </p>
      </div>

      <div className="grid gap-6">
        <ConversionRateManager />
      </div>
    </div>
  );
}
