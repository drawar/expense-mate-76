import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function DeleteMembershipRewards() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleDelete = async () => {
    setStatus("loading");
    setMessage("Deleting 'Membership Rewards' conversion rates...");

    try {
      const { error } = await supabase
        .from("conversion_rates")
        .delete()
        .eq("reward_currency", "Membership Rewards");

      if (error) throw error;

      setStatus("success");
      setMessage(
        "Successfully deleted all 'Membership Rewards' conversion rates!"
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-medium mb-4">
          Delete Old Membership Rewards
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          This will delete all conversion rates for "Membership Rewards"
          (without "Points").
        </p>

        {status === "idle" && (
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="w-full"
          >
            Delete Membership Rewards
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
