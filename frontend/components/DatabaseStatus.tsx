/**
 * Database Status Component
 * Shows RxDB initialization status and online/offline state
 */

import React, { useState, useEffect } from 'react';
import { useRxDB } from '../contexts/RxDBContext';

const DatabaseStatus: React.FC = () => {
  const { db, isLoading, error } = useRxDB();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>({});

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get document counts from each collection
  useEffect(() => {
    if (!db) return;

    const fetchCounts = async () => {
      try {
        const counts: Record<string, number> = {};
        
        counts.events = await db.events.count().exec();
        counts.attendees = await db.attendees.count().exec();
        counts.documents = await db.documents.count().exec();
        counts.whiteboards = await db.whiteboards.count().exec();
        counts.conversations = await db.conversations.count().exec();
        counts.messages = await db.messages.count().exec();

        setCollectionCounts(counts);
      } catch (err) {
        console.error('Failed to fetch collection counts:', err);
      }
    };

    fetchCounts();

    // Refresh counts every 5 seconds
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, [db]);

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        <span className="text-sm font-medium">Initializing database...</span>
      </div>
    );
  }

  const handleClearDatabase = () => {
    if (confirm('⚠️ This will clear all local data. Continue?')) {
      localStorage.setItem('CLEAR_DB', '1');
      window.location.reload();
    }
  };

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-xs">
        <div className="flex items-center space-x-2">
          <span className="text-xl">❌</span>
          <div className="flex-1">
            <div className="text-sm font-medium">Database Error</div>
            <div className="text-xs opacity-90 mb-2">{error.message}</div>
            {error.message.includes('schema') && (
              <button
                onClick={handleClearDatabase}
                className="text-xs bg-white text-red-600 px-2 py-1 rounded hover:bg-red-50"
              >
                Clear Database
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!db) {
    return null;
  }

  const totalDocuments = Object.values(collectionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{isOnline ? '🟢' : '🔴'}</span>
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">RxDB Active</span>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Total Documents:</span>
            <span className="font-medium">{totalDocuments}</span>
          </div>
          {Object.entries(collectionCounts).map(([collection, count]) => (
            count > 0 && (
              <div key={collection} className="flex justify-between pl-2">
                <span className="capitalize">{collection}:</span>
                <span>{count}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatabaseStatus;
