import { apiClient } from './api-client';
import {
  getPendingActions,
  removePendingAction,
  clearOldOfflineData,
} from './database';
import { usePickingStore } from '@/stores/picking-store';

interface PendingAction {
  id: number;
  action_type: string;
  order_id: string;
  item_id: string;
  payload: string;
  retries: number;
}

let isSyncing = false;

export async function syncPendingActions(): Promise<{
  synced: number;
  failed: number;
}> {
  if (isSyncing) {
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const actions = (await getPendingActions()) as PendingAction[];

    for (const action of actions) {
      try {
        const payload = JSON.parse(action.payload || '{}');

        switch (action.action_type) {
          case 'PICK_ITEM':
            await apiClient.pickItem(action.order_id, action.item_id);
            break;

          case 'MARK_UNAVAILABLE':
            await apiClient.markItemUnavailable(
              action.order_id,
              action.item_id,
              payload.reason,
              payload.notes
            );
            break;

          default:
            console.warn('Unknown action type:', action.action_type);
        }

        // Action synced successfully, remove from queue
        await removePendingAction(action.id);
        synced++;
      } catch (error: any) {
        console.error('Failed to sync action:', action, error);
        failed++;

        // If it's a network error, stop syncing
        if (error.message === 'لا يوجد اتصال بالإنترنت') {
          break;
        }
      }
    }

    // Clear old offline data after successful sync
    if (synced > 0) {
      await clearOldOfflineData();
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

// Check connectivity and sync
export async function checkAndSync(): Promise<boolean> {
  const { setOffline } = usePickingStore.getState();

  try {
    // Try a simple API call to check connectivity
    await apiClient.getProfile();
    setOffline(false);

    // Sync any pending actions
    const { synced, failed } = await syncPendingActions();
    console.log(`Synced ${synced} actions, ${failed} failed`);

    return true;
  } catch (error: any) {
    if (error.message === 'لا يوجد اتصال بالإنترنت') {
      setOffline(true);
    }
    return false;
  }
}

// Auto-sync when app comes to foreground
export function setupAutoSync() {
  // This would be called from AppState listener in App.tsx
  // For now, we can call checkAndSync manually
}
