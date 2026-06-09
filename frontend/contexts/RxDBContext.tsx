/**
 * RxDB Context Provider
 * Provides RxDB database instance to all React components
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDatabase, destroyDatabase, SinodDatabase } from '../database';

interface RxDBContextValue {
  db: SinodDatabase | null;
  isLoading: boolean;
  error: Error | null;
}

const RxDBContext = createContext<RxDBContextValue | undefined>(undefined);

interface RxDBProviderProps {
  children: ReactNode;
}

export const RxDBProvider: React.FC<RxDBProviderProps> = ({ children }) => {
  const [db, setDb] = useState<SinodDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initDB = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const database = await getDatabase();
        
        if (isMounted) {
          setDb(database);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('❌ Failed to initialize RxDB:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize database'));
          setIsLoading(false);
        }
      }
    };

    initDB();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (db) {
        // Don't destroy the database here as it might be used by other components
        // It will be cleaned up when the page unloads
        console.log('RxDB context unmounting');
      }
    };
  }, []);

  return (
    <RxDBContext.Provider value={{ db, isLoading, error }}>
      {children}
    </RxDBContext.Provider>
  );
};

/**
 * Hook to access RxDB database instance
 * @throws Error if used outside RxDBProvider
 */
export const useRxDB = (): RxDBContextValue => {
  const context = useContext(RxDBContext);
  if (context === undefined) {
    throw new Error('useRxDB must be used within a RxDBProvider');
  }
  return context;
};

/**
 * Hook to get RxDB database instance (convenience hook)
 * Returns null if database is not yet initialized
 */
export const useDatabase = (): SinodDatabase | null => {
  const { db } = useRxDB();
  return db;
};

/**
 * Hook to check if database is ready
 */
export const useDatabaseReady = (): boolean => {
  const { db, isLoading } = useRxDB();
  return !isLoading && db !== null;
};
