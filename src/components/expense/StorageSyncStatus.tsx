
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLastSyncTime } from '@/services/LocalDatabaseService';
import { formatDistanceToNow } from 'date-fns';

interface StorageSyncStatusProps {
  isOnline: boolean;
  onForceSync: () => Promise<void>;
  className?: string;
}

const StorageSyncStatus: React.FC<StorageSyncStatusProps> = ({
  isOnline,
  onForceSync,
  className = ''
}) => {
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  // Get last sync time when component mounts
  useEffect(() => {
    getLastSyncTime().then(date => {
      setLastSync(date);
    });
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: 'No Network Connection',
        description: 'You are currently offline. Cannot sync with server.',
        variant: 'destructive',
      });
      return;
    }

    setSyncInProgress(true);
    
    try {
      await onForceSync();
      
      // Update last sync time
      const newLastSync = new Date();
      setLastSync(newLastSync);
      
      toast({
        title: 'Sync Complete',
        description: 'Your data has been synchronized with the server',
        variant: 'default',
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Unknown error during sync',
        variant: 'destructive',
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="text-sm text-muted-foreground flex items-center mr-2">
        {isOnline ? (
          <Cloud className="h-4 w-4 mr-1 text-green-500" />
        ) : (
          <CloudOff className="h-4 w-4 mr-1 text-amber-500" />
        )}
        {isOnline ? 'Online' : 'Offline'}
        
        {lastSync && lastSync.getTime() > 0 && (
          <span className="ml-2">
            · Last sync: {formatDistanceToNow(lastSync, { addSuffix: true })}
          </span>
        )}
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSync} 
        disabled={!isOnline || syncInProgress}
      >
        {syncInProgress ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-1" />
            Sync Now
          </>
        )}
      </Button>
    </div>
  );
};

export default StorageSyncStatus;
