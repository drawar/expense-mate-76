
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface StorageModeAlertProps {
  useLocalStorage: boolean;
}

const StorageModeAlert: React.FC<StorageModeAlertProps> = ({ useLocalStorage }) => {
  if (!useLocalStorage) return null;

  return (
    <Alert className="mb-4 bg-amber-50 text-amber-700 border-amber-200">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle>Using local storage</AlertTitle>
      <AlertDescription>
        Transactions will be saved to local storage. Your data will only be available on this device.
      </AlertDescription>
    </Alert>
  );
};

export default StorageModeAlert;
