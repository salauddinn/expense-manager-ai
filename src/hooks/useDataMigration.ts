/**
 * On first login, detects localStorage data and offers a one-time migration to Supabase.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { hasLocalStorageData, migrateLocalStorageToSupabase, clearLocalStorageData } from '@/lib/dataMigration';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export function useDataMigration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Show prompt only if localStorage has data (first login on this device)
    if (hasLocalStorageData()) {
      setShowPrompt(true);
    }
  }, [user]);

  const runMigration = useCallback(async () => {
    setIsMigrating(true);
    setShowPrompt(false);
    logger.info('[DataMigration] Starting migration for user', user?.id);

    try {
      const result = await migrateLocalStorageToSupabase();

      if (result.success) {
        clearLocalStorageData();
        // Refresh all queries to pull from Supabase
        queryClient.invalidateQueries();
        const total = Object.values(result.counts).reduce((a, b) => a + b, 0);
        toast.success(`Migration complete! ${total} records moved to cloud.`);
        logger.info('[DataMigration] Success', result.counts);
      } else {
        toast.error(`Migration had ${result.errors.length} error(s). Some data may not have been migrated.`);
        logger.error('[DataMigration] Partial failure', result.errors);
      }
    } catch (err) {
      toast.error('Migration failed. Your local data is still safe.');
      logger.error('[DataMigration] Fatal error', err);
    } finally {
      setIsMigrating(false);
    }
  }, [user, queryClient]);

  const dismissMigration = useCallback(() => {
    setShowPrompt(false);
    logger.info('[DataMigration] Dismissed by user');
  }, []);

  return { showPrompt, isMigrating, runMigration, dismissMigration };
}
