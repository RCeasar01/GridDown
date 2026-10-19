import './app/i18n'; // Initialize i18next before anything else
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './app/navigation/AppNavigator';
import { OnboardingScreen } from './app/screens/OnboardingScreen';
import { initDatabase } from './app/db/contentLoader';
import { initializePurchases } from './app/utils/purchases';
import { useAppStore } from './app/store/useAppStore';

// ─── Error Boundary ───────────────────────────────────────────────────────────
// Catches unhandled render errors so users see a recovery screen instead of a
// blank white crash.

interface ErrorBoundaryState { hasError: boolean; }

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[App] Unhandled render error:', error, info.componentStack);
  }

  handleReset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <View style={ebStyles.container}>
          <Text style={ebStyles.title}>Something went wrong</Text>
          <Text style={ebStyles.body}>
            GridDown hit an unexpected error. Your data is safe.
          </Text>
          <TouchableOpacity
            style={ebStyles.btn}
            onPress={this.handleReset}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={ebStyles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const ebStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  body: { color: '#A0A0A0', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: 12,
    backgroundColor: '#8B9E67',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

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
    <SafeAreaProvider>
      <ErrorBoundary>
        {/* backgroundColor removed: Android edge-to-edge (SDK 54+) ignores it */}
        <StatusBar style="light" />
        {onboardingCompleted ? <AppNavigator /> : <OnboardingScreen />}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
