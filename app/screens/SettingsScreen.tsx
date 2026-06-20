import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { SUPPORTED_LANGUAGES, downloadLanguageModel, type SupportedLanguage, type DownloadProgress } from '../utils/translation';

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://rceasar01.github.io/GridDown/privacy';
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://rceasar01.github.io/GridDown/terms';
const APP_VERSION = '1.0.0';
const _DISCORD_URL = process.env.EXPO_PUBLIC_DISCORD_URL ?? 'https://discord.gg/griddown';

const PROFILE_DISPLAY: Record<string, string> = {
  urban: 'Urban / Civil Unrest',
  rural: 'Rural Homestead',
  vehicle: 'Vehicle / Travel',
  medic: 'Medic-Minded / TCCC',
  comms: 'HAM & Comms',
  disaster: 'Natural Disaster',
};

const REGION_DISPLAY: Record<string, string> = {
  northeast: 'Northeast US',
  southeast: 'Southeast US',
  midwest: 'Midwest US',
  southwest: 'Southwest US',
  northwest: 'Northwest US',
  alaska: 'Alaska',
  hawaii: 'Hawaii',
  international: 'International / Other',
};

export function SettingsScreen() {
  const { t } = useTranslation();
  const {
    userTier, selectedLanguage, translateContentEnabled,
    setSelectedLanguage, setTranslateContentEnabled,
    downloadedModels, markModelDownloaded,
    nightOpsEnabled, toggleNightOps,
    userProfile, userRegion, resetOnboarding,
  } = useAppStore();

  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [downloadingLang, setDownloadingLang] = useState<string | null>(null);
  const [drillReminderEnabled, setDrillReminderEnabled] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const val = await AsyncStorage.getItem('griddown_drill_reminder');
        setDrillReminderEnabled(val === 'true');
      } catch { /* ignore */ }
    })();
  }, []);

  const handleDrillReminderToggle = async (enabled: boolean) => {
    setDrillReminderEnabled(enabled);
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('griddown_drill_reminder', enabled ? 'true' : 'false');
      const Notifications = await import('expo-notifications');
      if (enabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          setDrillReminderEnabled(false);
          await AsyncStorage.setItem('griddown_drill_reminder', 'false');
          Alert.alert('Permission Required', 'Enable notifications in device Settings to receive drill reminders.');
          return;
        }
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎯 Daily Drill Ready',
            body: "Test your survival readiness. Today's drill is waiting.",
            sound: true,
          },
          trigger: { hour: 8, minute: 0, repeats: true } as any,
        });
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (err) {
      console.warn('Drill reminder error:', err);
    }
  };

  async function handleDownloadModel(langCode: SupportedLanguage) {
    if (downloadingLang) return;
    setDownloadingLang(langCode);
    setDownloadProgress((prev) => ({ ...prev, [langCode]: 0 }));
    try {
      await downloadLanguageModel(langCode, (prog: DownloadProgress) => {
        setDownloadProgress((prev) => ({ ...prev, [langCode]: prog.progress }));
      });
      markModelDownloaded(langCode);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      Alert.alert('Error', msg);
    } finally {
      setDownloadingLang(null);
    }
  }

  function handleOpenURL(url: string) {
    void Linking.openURL(url);
  }

  async function handleClearRecent() {
    Alert.alert(t('settings.clearRecent'), t('settings.clearRecentConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.clear'), style: 'destructive', onPress: async () => { await useAppStore.getState().clearRecent(); } },
    ]);
  }

  const tierDisplay: Record<string, string> = {
    free: t('tiers.free'), discord: t('tiers.discord'),
    monthly: t('tiers.monthly'), yearly: t('tiers.yearly'),
    lifetime_standard: t('tiers.lifetime_standard'),
    extreme_monthly: t('tiers.extreme_monthly'),
    extreme_yearly: t('tiers.extreme_yearly'),
    extreme_lifetime: t('tiers.extreme_lifetime'),
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* My Profile */}
      <Text style={styles.sectionHeader}>MY PROFILE</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Profile</Text>
          <Text style={styles.value}>
            {userProfile ? (PROFILE_DISPLAY[userProfile] ?? userProfile) : 'Not set'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Region</Text>
          <Text style={styles.value}>
            {userRegion ? (REGION_DISPLAY[userRegion] ?? userRegion) : 'Not set'}
          </Text>
        </View>
        <View style={styles.divider} />
        <TouchableOpacity
          style={[styles.row, { justifyContent: 'center' }]}
          onPress={() => {
            Alert.alert(
              'Change Profile',
              'This will restart the onboarding setup.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Continue',
                  onPress: () => void resetOnboarding(),
                },
              ],
            );
          }}
        >
          <Text style={{ color: '#8B9E67', fontWeight: '700', fontSize: 14 }}>
            CHANGE PROFILE
          </Text>
        </TouchableOpacity>
      </View>

      {/* Night Ops Mode */}
      <Text style={styles.sectionHeader}>DISPLAY</Text>
      <View style={[styles.card, nightOpsEnabled && styles.nightOpsCardActive]}>
        <View style={styles.row}>
          <View style={styles.nightOpsLabelRow}>
            <Ionicons
              name={nightOpsEnabled ? 'moon' : 'moon-outline'}
              size={20}
              color={nightOpsEnabled ? '#B85020' : '#888'}
              style={{ marginRight: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, nightOpsEnabled && styles.nightOpsLabel]}>NIGHT OPS MODE</Text>
              <Text style={styles.nightOpsHint}>Ultra-dark theme for low-light operations</Text>
            </View>
          </View>
          <Switch
            value={nightOpsEnabled}
            onValueChange={() => void toggleNightOps()}
            trackColor={{ false: '#333', true: '#B85020' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Subscription */}
      <Text style={styles.sectionHeader}>{t('settings.subscription')}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.currentPlan')}</Text>
          <Text style={styles.value}>{tierDisplay[userTier] ?? userTier}</Text>
        </View>
        {userTier === 'free' && (
          <TouchableOpacity style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>{t('settings.upgradePlan')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Language */}
      <Text style={styles.sectionHeader}>{t('settings.language')}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.translateContent')}</Text>
          <Switch
            value={translateContentEnabled}
            onValueChange={setTranslateContentEnabled}
            trackColor={{ false: '#333', true: '#8B9E67' }}
            thumbColor="#fff"
          />
        </View>
        <Text style={styles.hint}>{t('settings.translateContentHint')}</Text>
      </View>

      {SUPPORTED_LANGUAGES.map((lang) => {
        const isSelected = selectedLanguage === lang.code;
        const isDownloaded = downloadedModels.includes(lang.code);
        const isDownloading = downloadingLang === lang.code;
        const progress = downloadProgress[lang.code] ?? 0;

        return (
          <View key={lang.code} style={[styles.card, styles.langCard, isSelected && styles.langCardSelected]}>
            <TouchableOpacity style={styles.langRow} onPress={() => void setSelectedLanguage(lang.code)}>
              <Text style={styles.flag}>{lang.flagEmoji}</Text>
              <View style={styles.langInfo}>
                <Text style={styles.langName}>{lang.name}</Text>
                <Text style={styles.langNative}>{lang.nativeName}</Text>
              </View>
              {isSelected && <Text style={styles.selectedBadge}>✓</Text>}
            </TouchableOpacity>
            <View style={styles.modelRow}>
              {isDownloaded ? (
                <View style={styles.downloadedBadge}>
                  <Text style={styles.downloadedText}>{t('settings.downloaded')}</Text>
                </View>
              ) : isDownloading ? (
                <View style={styles.progressRow}>
                  <ActivityIndicator size="small" color="#8B9E67" />
                  <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.downloadBtn} onPress={() => void handleDownloadModel(lang.code)}>
                  <Text style={styles.downloadBtnText}>{t('settings.downloadModel')} ({t('settings.modelSize')})</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      {/* Daily Drill */}
      <Text style={styles.sectionHeader}>Daily Drill</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.label}>Daily Drill Reminder</Text>
            <Text style={[styles.hint, { paddingHorizontal: 0, paddingBottom: 0 }]}>
              Notification at 8:00 AM daily
            </Text>
          </View>
          <Switch
            value={drillReminderEnabled}
            onValueChange={(v) => void handleDrillReminderToggle(v)}
            trackColor={{ false: '#333', true: '#8B9E67' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Data */}
      <Text style={styles.sectionHeader}>{t('settings.data')}</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={() => void handleClearRecent()}>
          <Text style={styles.label}>{t('settings.clearRecent')}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={styles.sectionHeader}>{t('settings.about')}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.appVersion')}</Text>
          <Text style={styles.value}>{APP_VERSION}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.developer')}</Text>
          <Text style={styles.value}>BannedProduct Media Inc.</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.veteranOwned')}</Text>
          <Text style={styles.value}>🇺🇸</Text>
        </View>
      </View>

      {/* Legal */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={() => handleOpenURL(PRIVACY_URL)}>
          <Text style={styles.label}>{t('settings.privacyPolicy')}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row} onPress={() => handleOpenURL(TERMS_URL)}>
          <Text style={styles.label}>{t('settings.termsOfService')}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { padding: 16 },
  sectionHeader: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 1, marginTop: 24, marginBottom: 8, textTransform: 'uppercase' },
  card: { backgroundColor: '#1A1A1A', borderRadius: 10, marginBottom: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  langCard: { marginBottom: 6 },
  langCardSelected: { borderColor: '#8B9E67' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 8 },
  modelRow: { paddingHorizontal: 14, paddingBottom: 12 },
  langInfo: { flex: 1 },
  flag: { fontSize: 22, marginRight: 12 },
  langName: { fontSize: 15, color: '#F0F0F0', fontWeight: '600' },
  langNative: { fontSize: 12, color: '#888', marginTop: 2 },
  selectedBadge: { fontSize: 18, color: '#8B9E67', fontWeight: '700' },
  downloadBtn: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#8B9E67', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
  downloadBtnText: { color: '#8B9E67', fontSize: 12, fontWeight: '600' },
  downloadedBadge: { backgroundColor: '#1A3A1A', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#2A5A2A' },
  downloadedText: { color: '#4CAF50', fontSize: 12, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText: { color: '#8B9E67', fontSize: 12 },
  label: { fontSize: 15, color: '#F0F0F0' },
  value: { fontSize: 15, color: '#888' },
  hint: { fontSize: 12, color: '#666', paddingHorizontal: 14, paddingBottom: 12 },
  chevron: { fontSize: 20, color: '#888' },
  divider: { height: 1, backgroundColor: '#222', marginHorizontal: 14 },
  upgradeBtn: { margin: 14, marginTop: 4, backgroundColor: '#8B9E67', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  nightOpsCardActive: { borderColor: '#B85020' },
  nightOpsLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  nightOpsLabel: { color: '#B85020' },
  nightOpsHint: { fontSize: 11, color: '#666', marginTop: 2 },
});
