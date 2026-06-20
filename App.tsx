import './app/i18n'; // Initialize i18next before anything else
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './app/navigation/AppNavigator';
import { OnboardingScreen } from './app/screens/OnboardingScreen';
import { initDatabase } from './app/db/contentLoader';
import { initializePurchases } from './app/utils/purchases';
import { useAppStore } from './app/store/useAppStore';

export default function App() {
  const {
    setOffline, loadBookmarks, loadRecentlyViewed,
    loadLanguagePrefs, loadNightOps, loadOnboardingState,
    onboardingCompleted,
  } = useAppStore();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initDatabase();
        await Promise.all([
          loadBookmarks(),
          loadRecentlyViewed(),
          loadLanguagePrefs(),
          loadNightOps(),
          loadOnboardingState(),
        ]);
        setOffline(true);
        initializePurchases().catch(console.warn);
      } catch (err) {
        console.error('[App] Bootstrap error:', err);
      } finally {
        setBootstrapped(true);
      }
    }
    void bootstrap();
  }, []);

  if (!bootstrapped) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#0D0D0D" />
      {onboardingCompleted ? <AppNavigator /> : <OnboardingScreen />}
    </>
  );
}
