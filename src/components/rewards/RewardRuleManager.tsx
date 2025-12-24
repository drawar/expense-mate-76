import { useState, useEffect } from "react";
import { RewardRule } from "@/core/rewards/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RewardRuleEditor } from "./RewardRuleEditor";
import { getRuleRepository } from "@/core/rewards/RuleRepository";
import { PlusIcon, EditIcon, TrashIcon, WifiOffIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AuthenticationError,
  ValidationError,
  PersistenceError,
  RepositoryError,
} from "@/core/rewards/errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RewardRuleManagerProps {
  cardTypeId?: string;
}

export const RewardRuleManager: React.FC<RewardRuleManagerProps> = ({
  cardTypeId = "generic",
}) => {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<RewardRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardTypeId]);

  /**
   * Handle errors with user-friendly messages
   */
  const handleError = (error: unknown, operation: string) => {
    console.error(`Error ${operation}:`, error);

    if (error instanceof AuthenticationError) {
      toast({
        title: "Authentication Required",
        description:
          "You need to be logged in to manage reward rules. Please sign in and try again.",
        variant: "destructive",
      });
    } else if (error instanceof ValidationError) {
      toast({
        title: "Validation Error",
        description: `${error.message}${error.field ? ` (Field: ${error.field})` : ""}`,
        variant: "destructive",
      });
    } else if (error instanceof PersistenceError) {
      toast({
        title: "Save Failed",
        description:
          "Unable to save changes to the database. Please try again.",
        variant: "destructive",
      });
    } else if (error instanceof RepositoryError) {
      toast({
        title: "Operation Failed",
        description:
          error.message || `Failed to complete ${operation}. Please try again.`,
        variant: "destructive",
      });
    } else if (error instanceof Error) {
      // Check for network/connection errors
      if (
        error.message.includes("network") ||
        error.message.includes("offline") ||
        error.message.includes("connection") ||
        error.message.includes("fetch")
      ) {
        setIsOffline(true);
        toast({
          title: "Connection Error",
          description:
            "Unable to connect to the server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description:
            error.message ||
            `An error occurred while ${operation}. Please try again.`,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Unexpected Error",
        description: `An unexpected error occurred while ${operation}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const loadRules = async () => {
    try {
      setLoadError(null);
      setIsOffline(false);
      const repository = getRuleRepository();
      const loadedRules = await repository.getRulesForCardType(cardTypeId);
      setRules(loadedRules);
    } catch (error) {
      console.error("Error loading rules:", error);
      handleError(error, "loading rules");

      // Set offline state for connection errors
      if (
        error instanceof Error &&
        (error.message.includes("network") ||
          error.message.includes("offline") ||
          error.message.includes("connection"))
      ) {
        setIsOffline(true);
        setLoadError(
          "Unable to connect to the server. Please check your internet connection."
        );
      } else if (error instanceof AuthenticationError) {
        setLoadError("You need to be logged in to view reward rules.");
      } else {
        setLoadError("Failed to load reward rules. Please try again.");
      }
    }
  };

  const handleCreateRule = () => {
    setSelectedRule(null);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEditRule = (rule: RewardRule) => {
    setSelectedRule(rule);
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleSaveRule = async (rule: RewardRule) => {
    try {
      const repository = getRuleRepository();

      if (isCreating) {
        const newRule = await repository.createRule({
          cardTypeId: cardTypeId,
          name: rule.name,
          description: rule.description,
          enabled: rule.enabled,
          priority: rule.priority,
          conditions: rule.conditions,
          reward: rule.reward,
        });
        setRules([...rules, newRule]);
        toast({
          title: "Success",
          description: "Reward rule created successfully.",
        });
      } else {
        await repository.updateRule(rule);
        setRules(rules.map((r) => (r.id === rule.id ? rule : r)));
        toast({
          title: "Success",
          description: "Reward rule updated successfully.",
        });
      }

      setIsEditing(false);
      setSelectedRule(null);
      setIsCreating(false);
      setIsOffline(false);
    } catch (error) {
      handleError(error, isCreating ? "creating rule" : "updating rule");
      // Don't close the editor on error so user can retry
      return;
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const repository = getRuleRepository();
      await repository.deleteRule(ruleId);
      setRules(rules.filter((r) => r.id !== ruleId));
      toast({
        title: "Success",
        description: "Reward rule deleted successfully.",
      });
      setIsOffline(false);
    } catch (error) {
      handleError(error, "deleting rule");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedRule(null);
    setIsCreating(false);
  };

  if (isEditing) {
    return (
      <RewardRuleEditor
        rule={selectedRule}
        onSave={handleSaveRule}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Offline/Error Alert */}
      {(isOffline || loadError) && (
        <Alert variant="destructive">
          <WifiOffIcon className="h-4 w-4" />
          <AlertTitle>
            {isOffline ? "Connection Issue" : "Error Loading Rules"}
          </AlertTitle>
          <AlertDescription>
            {loadError ||
              "Unable to connect to the server. Reward rules cannot be modified while offline."}
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={loadRules}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-medium">Reward Rules</h2>
        <Button
          onClick={handleCreateRule}
          disabled={isOffline}
          title={
            isOffline
              ? "Cannot create rules while offline"
              : "Create a new reward rule"
          }
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {rule.name}
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rule.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                    disabled={isOffline}
                    title={
                      isOffline
                        ? "Cannot edit rules while offline"
                        : "Edit rule"
                    }
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={isOffline}
                    title={
                      isOffline
                        ? "Cannot delete rules while offline"
                        : "Delete rule"
                    }
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p>
                  <strong>Priority:</strong> {rule.priority}
                </p>
                <p>
                  <strong>Conditions:</strong> {rule.conditions.length}{" "}
                  condition(s)
                </p>
                <p>
                  <strong>Base Multiplier:</strong> {rule.reward.baseMultiplier}
                  x
                </p>
                <p>
                  <strong>Points Currency:</strong> {rule.reward.pointsCurrency}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No rules configured yet.</p>
              <Button onClick={handleCreateRule} className="mt-4">
                Create your first rule
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RewardRuleManager;
