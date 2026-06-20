import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
  FlatList, Modal,
} from 'react-native';
import { Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  translateText,
  isModelDownloaded,
  downloadLanguageModel,
} from '../utils/translation';

interface HistoryEntry {
  input: string;
  output: string;
  lang: string;
}

const EMERGENCY_PHRASES = [
  'I need help',
  'Call an ambulance',
  'Where is the hospital?',
  'I am injured',
  'Do you speak English?',
  'Water / Food / Shelter',
  'I cannot breathe',
  'Stay here / Go there',
  'Are you okay?',
  'We need to evacuate',
  'Do not move me',
  'I am allergic to...',
  'There are more injured people',
  'We need rescue',
  'This person is unconscious',
];

const PHRASE_ICONS: Record<number, string> = {
  0: '🔥',
  1: '💧',
  2: '🩺',
  3: '🍎',
  4: '📍',
  5: '⚠️',
  10: '🚫',
  11: '⚕️',
  12: '🚑',
  13: '🛟',
  14: '😴',
};

export function TranslatorScreen() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [modelDownloaded, setModelDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [translationHistory, setTranslationHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState('');
  const [showPhraseIndex, setShowPhraseIndex] = useState<number | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkModel = useCallback(async (lang: SupportedLanguage) => {
    const downloaded = await isModelDownloaded(lang);
    setModelDownloaded(downloaded);
  }, []);

  useEffect(() => {
    checkModel(targetLang);
  }, [targetLang, checkModel]);

  const handleDownload = async () => {
    setDownloadProgress(0.01);
    try {
      await downloadLanguageModel(targetLang, (p) => {
        setDownloadProgress(p.progress);
      });
      setModelDownloaded(true);
      setDownloadProgress(0);
    } catch (e) {
      Alert.alert('Download Failed', 'Could not download language model. Try again.');
      setDownloadProgress(0);
    }
  };

  const handleTranslate = useCallback(async (text?: string) => {
    const toTranslate = text ?? inputText;
    if (!toTranslate.trim()) return;
    if (!modelDownloaded) {
      Alert.alert(
        'Model Not Downloaded',
        'Download the language model to translate offline.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: handleDownload },
        ]
      );
      return;
    }
    setIsTranslating(true);
    try {
      const result = await translateText(toTranslate, targetLang);
      setOutputText(result);
      setTranslationHistory(prev => {
        const entry: HistoryEntry = { input: toTranslate, output: result, lang: targetLang };
        return [entry, ...prev].slice(0, 10);
      });
    } catch (e) {
      Alert.alert('Translation Error', 'Could not translate text. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  }, [inputText, targetLang, modelDownloaded]);

  const handleCopy = () => {
    if (!outputText) return;
    Clipboard.setString(outputText);
    Alert.alert('Copied', 'Translation copied to clipboard.');
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      handleTranslate(text);
    }, 500);
  };

  const handlePhrasePress = (phrase: string, index: number) => {
    setSelectedPhrase(phrase);
    setInputText(phrase);
    setShowPhraseIndex(index);
    handleTranslate(phrase);
  };

  const handleLangSelect = (lang: SupportedLanguage) => {
    setTargetLang(lang);
    setOutputText('');
    checkModel(lang);
  };

  const getTranslatedPhrase = (phraseIndex: number, _lang: SupportedLanguage): string => {
    if (selectedPhrase === EMERGENCY_PHRASES[phraseIndex]) return outputText;
    return EMERGENCY_PHRASES[phraseIndex];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌐 Offline Translator</Text>
          <Text style={styles.headerSubtitle}>All translation is on-device. No internet needed.</Text>
        </View>

        {/* Input Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Type or paste text:</Text>
          <TextInput
            style={styles.textInput}
            multiline
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Type in any language..."
            placeholderTextColor={Colors.textMuted}
            textAlignVertical="top"
          />
        </View>

        {/* Language Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Translate to →</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langChip, targetLang === lang.code && styles.langChipActive]}
                onPress={() => handleLangSelect(lang.code as SupportedLanguage)}
              >
                <Text style={styles.langFlag}>{lang.flagEmoji}</Text>
                <Text style={[styles.langName, targetLang === lang.code && styles.langNameActive]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Translate Button */}
        <TouchableOpacity
          style={styles.translateBtn}
          onPress={() => handleTranslate()}
          disabled={isTranslating}
        >
          {isTranslating
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.translateBtnText}>Translate</Text>
          }
        </TouchableOpacity>

        {/* Model Warning */}
        {!modelDownloaded && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ Model not downloaded — ~30 MB required</Text>
            <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
              <Text style={styles.downloadBtnText}>Download</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Download Progress */}
        {downloadProgress > 0 && downloadProgress < 1 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Downloading... {Math.round(downloadProgress * 100)}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${downloadProgress * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Output Section */}
        {outputText ? (
          <View style={styles.outputSection}>
            <Text style={styles.label}>Translation:</Text>
            <View style={styles.outputBox}>
              <Text style={styles.outputText}>{outputText}</Text>
            </View>
            <View style={styles.outputActions}>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={18} color={Colors.textPrimary} />
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearBtn} onPress={() => { setInputText(''); setOutputText(''); }}>
                <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Emergency Phrases */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>⚡ EMERGENCY PHRASES</Text>
          <Text style={styles.sectionSubtitle}>Tap a phrase to instantly translate</Text>
          <View style={styles.phraseGrid}>
            {EMERGENCY_PHRASES.map((phrase, index) => (
              <TouchableOpacity
                key={phrase}
                style={[styles.phraseBtn, selectedPhrase === phrase && styles.phraseBtnActive]}
                onPress={() => handlePhrasePress(phrase, index)}
              >
                <Text style={styles.phraseBtnIcon}>{PHRASE_ICONS[index] ?? '📢'}</Text>
                <Text style={styles.phraseBtnText}>{phrase}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedPhrase && outputText ? (
            <View style={styles.emergencyOutput}>
              <Text style={styles.emergencyOutputLabel}>
                → {targetLang.toUpperCase()}
              </Text>
              <Text style={styles.emergencyOutputText}>{outputText}</Text>
            </View>
          ) : null}
        </View>

        {/* History Toggle */}
        <TouchableOpacity style={styles.historyToggle} onPress={() => setShowHistory(v => !v)}>
          <Ionicons name={showHistory ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
          <Text style={styles.historyToggleText}>🕐 HISTORY ({translationHistory.length})</Text>
        </TouchableOpacity>

        {showHistory && (
          <FlatList
            data={translationHistory}
            keyExtractor={(_, i) => String(i)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <Text style={styles.historyLang}>{item.lang.toUpperCase()}</Text>
                <Text style={styles.historyInput} numberOfLines={1}>{item.input}</Text>
                <Text style={styles.historyOutput} numberOfLines={2}>{item.output}</Text>
              </View>
            )}
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {showPhraseIndex !== null && (
        <Modal visible transparent animationType="fade">
          <TouchableOpacity
            style={styles.phraseFullScreen}
            onPress={() => setShowPhraseIndex(null)}
            activeOpacity={1}
          >
            <Text style={styles.phraseFullScreenIcon}>
              {PHRASE_ICONS[showPhraseIndex] ?? '📢'}
            </Text>
            <Text style={styles.phraseFullScreenText}>
              {getTranslatedPhrase(showPhraseIndex, targetLang)}
            </Text>
            <Text style={styles.phraseFullScreenDismiss}>TAP TO DISMISS</Text>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: 16 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 1 },
  headerSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: Colors.primary, letterSpacing: 2, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    color: Colors.textPrimary,
    fontSize: 16,
    padding: 14,
    minHeight: 120,
    lineHeight: 22,
  },
  langScroll: { flexDirection: 'row' },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  langChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  langFlag: { fontSize: 18, marginRight: 6 },
  langName: { fontSize: 13, color: Colors.textSecondary },
  langNameActive: { color: Colors.textPrimary, fontWeight: '700' },

  translateBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  translateBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  warningBox: {
    backgroundColor: '#2A2200',
    borderWidth: 1,
    borderColor: '#6A5200',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningText: { color: '#FFD700', fontSize: 13, flex: 1 },
  downloadBtn: {
    backgroundColor: '#6A5200',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  downloadBtnText: { color: '#FFD700', fontWeight: '700', fontSize: 13 },
  progressContainer: { marginBottom: 16 },
  progressLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  progressTrack: { height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  outputSection: { marginBottom: 20 },
  outputBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    padding: 16,
    minHeight: 80,
    marginBottom: 10,
  },
  outputText: { color: Colors.textPrimary, fontSize: 28, lineHeight: 38 },

  outputActions: { flexDirection: 'row', gap: 10 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 6,
    gap: 6,
  },
  copyBtnText: { color: Colors.textPrimary, fontSize: 14 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 6,
    gap: 6,
  },
  clearBtnText: { color: Colors.textSecondary, fontSize: 14 },
  phraseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  phraseBtn: {
    width: '47%',
    minHeight: 52,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  phraseBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  phraseBtnIcon: { fontSize: 18, marginBottom: 2 },
  phraseBtnText: { color: Colors.textPrimary, fontSize: 13, textAlign: 'center', fontWeight: '600' },

  emergencyOutput: {
    marginTop: 16,
    backgroundColor: '#0A0A0A',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 10,
    padding: 18,
  },
  emergencyOutputLabel: { color: Colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  emergencyOutputText: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', lineHeight: 42 },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
    marginBottom: 10,
  },
  historyToggleText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  historyItem: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyLang: { color: Colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  historyInput: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4 },
  historyOutput: { color: Colors.textPrimary, fontSize: 15, lineHeight: 22 },
  phraseFullScreen: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 32 },
  phraseFullScreenIcon: { fontSize: 64 },
  phraseFullScreenText: { fontSize: 72, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', lineHeight: 80 },
  phraseFullScreenDismiss: { fontSize: 14, color: '#555', marginTop: 32, letterSpacing: 2 },
});
