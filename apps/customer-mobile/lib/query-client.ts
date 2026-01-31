import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'hypermarket-query-cache',
  throttleTime: 1000,
});

export const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) => {
      const key = query.queryKey[0];
      // Only persist safe caches
      return key === 'products' || key === 'categories' || key === 'settings';
    },
  },
};
