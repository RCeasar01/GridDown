import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './app/navigation/AppNavigator';
import { initDatabase } from './app/db/contentLoader';
import { initializePurchases } from './app/utils/purchases';
import { useAppStore } from './app/store/useAppStore';

export default function App() {
  const { setOffline, setUserTier, loadBookmarks, loadRecentlyViewed } = useAppStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        // 1. Initialize SQLite database
        await initDatabase();

        // 2. Load persisted state into Zustand
        await Promise.all([loadBookmarks(), loadRecentlyViewed()]);

        // 3. Mark app as offline-first
        setOffline(true);

        // 4. Initialize RevenueCat (non-blocking)
        initializePurchases().catch(console.warn);
      } catch (err) {
        console.error('[App] Bootstrap error:', err);
      }
    }
    bootstrap();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#0D0D0D" />
      <AppNavigator />
    </>
  );
}
