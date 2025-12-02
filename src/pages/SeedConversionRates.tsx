import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConversionService, MilesCurrency } from "@/core/currency/ConversionService";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const INITIAL_CONVERSION_RATES: Array<{
  rewardCurrency: string;
  rates: Partial<Record<MilesCurrency, number>>;
}> = [
  { rewardCurrency: "Citi ThankYou Points", rates: { KrisFlyer: 1.0, AsiaMiles: 1.0, Avios: 1.0, FlyingBlue: 1.0, Aeroplan: 1.0, Velocity: 1.0 } },
  { rewardCurrency: "Membership Rewards Points", rates: { KrisFlyer: 1.0, AsiaMiles: 1.0, Avios: 1.0, FlyingBlue: 1.0, Aeroplan: 1.0, Velocity: 1.0 } },
  { rewardCurrency: "Chase Ultimate Rewards", rates: { KrisFlyer: 1.0, AsiaMiles: 1.0, Avios: 1.0, FlyingBlue: 1.0, Aeroplan: 1.0, Velocity: 1.0 } },
  { rewardCurrency: "Capital One Miles", rates: { KrisFlyer: 1.0, AsiaMiles: 1.0, Avios: 1.0, FlyingBlue: 1.0, Aeroplan: 1.0, Velocity: 1.0 } },
  { rewardCurrency: "Marriott Bonvoy Points", rates: { KrisFlyer: 0.3333, AsiaMiles: 0.3333, Avios: 0.3333, FlyingBlue: 0.3333, Aeroplan: 0.3333, Velocity: 0.3333 } },
];

export default function SeedConversionRates() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSeed = async () => {
    setStatus("loading");
    setMessage("Seeding conversion rates...");

    try {
      const conversionService = ConversionService.getInstance();
      
      const updates: Array<{
        rewardCurrency: string;
        milesCurrency: MilesCurrency;
        rate: number;
      }> = [];

      for (const { rewardCurrency, rates } of INITIAL_CONVERSION_RATES) {
        for (const [milesCurrency, rate] of Object.entries(rates)) {
          if (rate !== undefined) {
            updates.push({
              rewardCurrency,
              milesCurrency: milesCurrency as MilesCurrency,
              rate,
            });
          }
        }
      }

      await conversionService.batchUpdateConversionRates(updates);
      
      setStatus("success");
      setMessage(`Successfully seeded ${updates.length} conversion rates!`);
    } catch (error) {
      setStatus("error");
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Seed Conversion Rates</h1>
        
        {status === "idle" && (
          <Button onClick={handleSeed} className="w-full">
            Seed Conversion Rates
          </Button>
        )}
        
        {status === "loading" && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{message}</span>
          </div>
        )}
        
        {status === "success" && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>{message}</span>
          </div>
        )}
        
        {status === "error" && (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
