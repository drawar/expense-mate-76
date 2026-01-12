import React, { useState } from "react";
import { Transaction, PaymentMethod } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TransactionDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  paymentMethods: PaymentMethod[];
}

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  paymentMethods,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!transaction) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction);
    }
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(transaction);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Transaction Details</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Amount
                  </label>
                  <p className="text-lg">
                    {transaction.currency} {transaction.amount}
                  </p>
                </div>

                <div>
                  <label
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Merchant
                  </label>
                  <p>{transaction.merchant?.name || "Unknown"}</p>
                </div>

                <div>
                  <label
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Payment Method
                  </label>
                  <p>{transaction.paymentMethod?.name || "Unknown"}</p>
                </div>

                <div>
                  <label
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Points Earned
                  </label>
                  <p>{transaction.rewardPoints || 0} points</p>
                </div>
              </div>

              {transaction.notes && (
                <div>
                  <label
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Notes
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {transaction.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                {onEdit && (
                  <Button variant="outline" onClick={handleEdit}>
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;
