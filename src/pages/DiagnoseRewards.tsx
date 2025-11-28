/**
 * Diagnostic page to identify reward rules issues
 * Access this page at /diagnose-rewards
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getRuleRepository } from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

interface PaymentMethodInfo {
  id: string;
  issuer: string;
  name: string;
  cardTypeId: string;
}

interface RewardRuleInfo {
  id: string;
  cardTypeId: string;
  name: string;
  priority: number;
  enabled: boolean;
}

interface DiagnosticResult {
  paymentMethods: PaymentMethodInfo[];
  rewardRules: RewardRuleInfo[];
  matches: { paymentMethod: PaymentMethodInfo; ruleCount: number }[];
  mismatches: PaymentMethodInfo[];
  orphanedCardTypeIds: string[];
}

export default function DiagnoseRewards() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  useEffect(() => {
    diagnose();
  }, []);

  async function diagnose() {
    setLoading(true);
    setError(null);

    try {
      // Check authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("Not authenticated. Please log in first.");
        setLoading(false);
        return;
      }

      // Get payment methods
      const { data: paymentMethods, error: pmError } = await supabase
        .from("payment_methods")
        .select("*")
        .order("name");

      if (pmError) throw pmError;

      // Get reward rules
      const { data: rewardRules, error: rrError } = await supabase
        .from("reward_rules")
        .select("*")
        .order("card_type_id, priority");

      if (rrError) throw rrError;

      // Process payment methods
      const pmInfo: PaymentMethodInfo[] = (paymentMethods || []).map((pm) => ({
        id: pm.id,
        issuer: pm.issuer,
        name: pm.name,
        cardTypeId: cardTypeIdService.generateCardTypeId(pm.issuer, pm.name),
      }));

      // Process reward rules
      const rrInfo: RewardRuleInfo[] = (rewardRules || []).map((rr) => ({
        id: rr.id,
        cardTypeId: rr.card_type_id,
        name: rr.name,
        priority: rr.priority,
        enabled: rr.enabled,
      }));

      // Group rules by card type ID
      const rulesByCardType = rrInfo.reduce(
        (acc, rule) => {
          if (!acc[rule.cardTypeId]) {
            acc[rule.cardTypeId] = [];
          }
          acc[rule.cardTypeId].push(rule);
          return acc;
        },
        {} as Record<string, RewardRuleInfo[]>
      );

      // Find matches and mismatches
      const matches: { paymentMethod: PaymentMethodInfo; ruleCount: number }[] =
        [];
      const mismatches: PaymentMethodInfo[] = [];

      pmInfo.forEach((pm) => {
        const rules = rulesByCardType[pm.cardTypeId];
        if (rules && rules.length > 0) {
          matches.push({ paymentMethod: pm, ruleCount: rules.length });
        } else {
          mismatches.push(pm);
        }
      });

      // Find orphaned card type IDs
      const pmCardTypeIds = new Set(pmInfo.map((pm) => pm.cardTypeId));
      const orphanedCardTypeIds = Object.keys(rulesByCardType).filter(
        (cardTypeId) => !pmCardTypeIds.has(cardTypeId)
      );

      setResult({
        paymentMethods: pmInfo,
        rewardRules: rrInfo,
        matches,
        mismatches,
        orphanedCardTypeIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Diagnosing reward rules...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reward Rules Diagnostic</h1>
        <p className="text-muted-foreground">
          This page helps identify why reward rules aren't showing up for your
          payment methods.
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Total Payment Methods:</span>
            <Badge variant="secondary">{result.paymentMethods.length}</Badge>
          </div>
          <div className="flex justify-between">
            <span>With Matching Rules:</span>
            <Badge variant="default" className="bg-green-600">
              {result.matches.length}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Without Matching Rules:</span>
            <Badge variant="destructive">{result.mismatches.length}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Total Reward Rules:</span>
            <Badge variant="secondary">{result.rewardRules.length}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Orphaned Card Types:</span>
            <Badge variant="outline">{result.orphanedCardTypeIds.length}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Matches */}
      {result.matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Payment Methods with Matching Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.matches.map(({ paymentMethod, ruleCount }) => (
              <div
                key={paymentMethod.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {paymentMethod.issuer} {paymentMethod.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Card Type ID: <code>{paymentMethod.cardTypeId}</code>
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    {ruleCount} rule{ruleCount !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mismatches */}
      {result.mismatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Payment Methods WITHOUT Matching Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                These payment methods won't show reward points because no
                matching rules exist. Update the payment method name/issuer or
                create matching reward rules.
              </AlertDescription>
            </Alert>

            {result.mismatches.map((pm) => (
              <div key={pm.id} className="border rounded-lg p-4 space-y-2">
                <div>
                  <p className="font-semibold">
                    {pm.issuer} {pm.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Generated Card Type ID: <code>{pm.cardTypeId}</code>
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    ❌ No reward rules found with this Card Type ID
                  </p>
                </div>
                <div className="bg-muted p-3 rounded text-sm space-y-1">
                  <p className="font-semibold">To fix this:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      Edit the payment method to match an existing card type
                    </li>
                    <li>
                      Or run the setup script for this card (e.g.,
                      setupAmexCobaltCard.ts)
                    </li>
                  </ol>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Orphaned Rules */}
      {result.orphanedCardTypeIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Orphaned Reward Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                These reward rules exist but don't match any payment methods.
                They won't be used.
              </AlertDescription>
            </Alert>

            {result.orphanedCardTypeIds.map((cardTypeId) => {
              const rules = result.rewardRules.filter(
                (r) => r.cardTypeId === cardTypeId
              );
              return (
                <div
                  key={cardTypeId}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div>
                    <p className="font-semibold">Card Type ID: {cardTypeId}</p>
                    <p className="text-sm text-muted-foreground">
                      {rules.length} rule{rules.length !== 1 ? "s" : ""}:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2">
                      {rules.map((rule) => (
                        <li key={rule.id}>
                          {rule.name} (Priority: {rule.priority})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All Good */}
      {result.mismatches.length === 0 &&
        result.orphanedCardTypeIds.length === 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>All Good!</AlertTitle>
            <AlertDescription>
              All payment methods have matching reward rules. If you're still
              seeing issues, check the browser console for errors.
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
