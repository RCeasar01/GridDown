import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { SUPPORTED_LANGUAGES, downloadLanguageModel, type SupportedLanguage, type DownloadProgress } from '../utils/translation';

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://rceasar01.github.io/GridDown/privacy';
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://rceasar01.github.io/GridDown/terms';
const APP_VERSION = '1.0.0';
const DISCORD_URL = process.env.EXPO_PUBLIC_DISCORD_URL ?? 'https://discord.gg/griddown';

export function SettingsScreen() {
  const { t } = useTranslation();
  const {
    userTier, selectedLanguage, translateContentEnabled,
    setSelectedLanguage, setTranslateContentEnabled,
    downloadedModels, markModelDownloaded,
  } = useAppStore();

  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [downloadingLang, setDownloadingLang] = useState<string | null>(null);

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
            trackColor={{ false: '#333', true: '#E8642A' }}
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
                  <ActivityIndicator size="small" color="#E8642A" />
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
  langCardSelected: { borderColor: '#E8642A' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 8 },
  modelRow: { paddingHorizontal: 14, paddingBottom: 12 },
  langInfo: { flex: 1 },
  flag: { fontSize: 22, marginRight: 12 },
  langName: { fontSize: 15, color: '#F0F0F0', fontWeight: '600' },
  langNative: { fontSize: 12, color: '#888', marginTop: 2 },
  selectedBadge: { fontSize: 18, color: '#E8642A', fontWeight: '700' },
  downloadBtn: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#E8642A', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
  downloadBtnText: { color: '#E8642A', fontSize: 12, fontWeight: '600' },
  downloadedBadge: { backgroundColor: '#1A3A1A', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#2A5A2A' },
  downloadedText: { color: '#4CAF50', fontSize: 12, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText: { color: '#E8642A', fontSize: 12 },
  label: { fontSize: 15, color: '#F0F0F0' },
  value: { fontSize: 15, color: '#888' },
  hint: { fontSize: 12, color: '#666', paddingHorizontal: 14, paddingBottom: 12 },
  chevron: { fontSize: 20, color: '#888' },
  divider: { height: 1, backgroundColor: '#222', marginHorizontal: 14 },
  upgradeBtn: { margin: 14, marginTop: 4, backgroundColor: '#E8642A', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
