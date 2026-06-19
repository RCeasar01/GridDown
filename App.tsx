import './app/i18n'; // Initialize i18next before anything else
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './app/navigation/AppNavigator';
import { initDatabase } from './app/db/contentLoader';
import { initializePurchases } from './app/utils/purchases';
import { useAppStore } from './app/store/useAppStore';

export default function App() {
  const { setOffline, loadBookmarks, loadRecentlyViewed, loadLanguagePrefs } = useAppStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        await initDatabase();
        await Promise.all([
          loadBookmarks(),
          loadRecentlyViewed(),
          loadLanguagePrefs(),
        ]);
        setOffline(true);
        initializePurchases().catch(console.warn);
      } catch (err) {
        console.error('[App] Bootstrap error:', err);
      }
    }
    void bootstrap();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#0D0D0D" />
      <AppNavigator />
    </>
  );
}
