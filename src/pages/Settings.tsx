import {
  ConversionRateManager,
  DefaultCurrencySelector,
} from "@/components/settings";

/**
 * Settings page for managing application configuration
 */
export default function Settings() {
  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-16 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-gradient">
              Settings
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Manage your application settings and preferences
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <DefaultCurrencySelector />
          <ConversionRateManager />
        </div>
      </div>
    </div>
  );
}
