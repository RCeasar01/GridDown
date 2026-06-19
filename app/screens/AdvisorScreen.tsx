import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';

interface Message {
  id: string;
  role: 'user' | 'advisor';
  text: string;
  timestamp: number;
}

const LOCKED_TIERS = ['free', 'monthly', 'yearly', 'lifetime_standard', 'discord'];

type ModelStatus =
  | 'checking'
  | 'not_downloaded'
  | 'downloading'
  | 'loading'
  | 'online'
  | 'error';

const MODEL_NAME = 'Phi-3.5 Mini Instruct (Q4, 2.2 GB)';
const MODEL_FILE = 'phi-3.5-mini-q4.gguf';
const MODEL_URL =
  'https://huggingface.co/microsoft/Phi-3.5-mini-instruct-gguf/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf';

const SYSTEM_PROMPT =
  'You are Field Intelligence, a tactical survival advisor. You have training in combat medicine, wilderness survival, urban preparedness, and emergency response. You give direct, accurate, prioritized answers. No filler. Lives may depend on your answer.';

export function AdvisorScreen() {
  const { userTier } = useAppStore();
  const isLocked = LOCKED_TIERS.includes(userTier);

  if (isLocked) {
    return <LockedAdvisor />;
  }

  return <AdvisorInterface />;
}

function LockedAdvisor() {
  const navigation = require('@react-navigation/native').useNavigation();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.lockedContainer}>
        <View style={styles.lockIconContainer}>
          <Ionicons name="lock-closed" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.lockBadge}>FIELD INTELLIGENCE</Text>
        <Text style={styles.lockTitle}>EXTREME TIER REQUIRED</Text>
        <Text style={styles.lockSub}>
          The AI Advisor runs fully on-device — no internet, no cloud, no logs. Your questions never
          leave your phone. Available exclusively to Extreme tier subscribers.
        </Text>
        <View style={styles.featureList}>
          {[
            'Tactical Q&A — ask any survival question',
            'Context-aware medical and field advice',
            'Fully offline — no network required',
            'No data ever leaves your device',
            'Powered by Phi-3.5 Mini on-device LLM',
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <Ionicons name="radio-outline" size={14} color={Colors.secondary} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={() =>
            navigation.navigate('Home', {
              screen: 'Paywall',
              params: { featureName: 'Field Intelligence AI Advisor' },
            })
          }
        >
          <Text style={styles.upgradeBtnText}>Upgrade to Extreme</Text>
        </TouchableOpacity>
        <Text style={styles.tierNote}>
          Requires Extreme Monthly, Extreme Yearly, or Extreme Lifetime
        </Text>
      </View>
    </SafeAreaView>
  );
}

function AdvisorInterface() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('checking');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Check model status on mount
  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    try {
      // Dynamic import to avoid crashing when llama.rn not available
      const FileSystem = await import('expo-file-system');
      const modelPath = `${FileSystem.documentDirectory}${MODEL_FILE}`;
      const info = await FileSystem.getInfoAsync(modelPath);
      if (info.exists) {
        setModelStatus('loading');
        await initModel(modelPath);
      } else {
        setModelStatus('not_downloaded');
      }
    } catch {
      setModelStatus('not_downloaded');
    }
  };

  const initModel = async (modelPath: string) => {
    try {
      // llama.rn integration — falls back gracefully if not available
      setModelStatus('loading');
      // Attempt to load llama.rn context
      const { initLlama } = await import('llama.rn').catch(() => ({ initLlama: null }));
      if (initLlama) {
        await initLlama({ model: modelPath, n_ctx: 2048, n_batch: 512 });
        setModelStatus('online');
        setMessages([
          {
            id: '0',
            role: 'advisor',
            text: 'Field Intelligence online. Operating fully offline. Ask your question.',
            timestamp: Date.now(),
          },
        ]);
      } else {
        // llama.rn not available — use scaffold mode
        setModelStatus('online');
        setMessages([
          {
            id: '0',
            role: 'advisor',
            text: 'Field Intelligence initialized in scaffold mode. Model runtime will be active in production build. Ask your question for a demonstration response.',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch {
      setModelStatus('error');
    }
  };

  const handleDownload = async () => {
    try {
      setModelStatus('downloading');
      setDownloadProgress(0);
      const FileSystem = await import('expo-file-system');
      const modelPath = `${FileSystem.documentDirectory}${MODEL_FILE}`;
      const downloadResumable = FileSystem.createDownloadResumable(
        MODEL_URL,
        modelPath,
        {},
        (progress) => {
          const pct =
            progress.totalBytesExpectedToWrite > 0
              ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
              : 0;
          setDownloadProgress(pct);
        },
      );
      await downloadResumable.downloadAsync();
      setModelStatus('loading');
      await initModel(modelPath);
    } catch (err) {
      setModelStatus('not_downloaded');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;
    const userText = input.trim();
    setInput('');
    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      let responseText: string;
      const { getLlamaContext } = await import('llama.rn').catch(() => ({ getLlamaContext: null }));
      if (getLlamaContext) {
        const ctx = getLlamaContext();
        if (ctx) {
          const result = await ctx.completion({
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...messages.map((m) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.text,
              })),
              { role: 'user', content: userText },
            ],
            n_predict: 512,
            temperature: 0.7,
          });
          responseText = result.text;
        } else {
          responseText = scaffoldResponse(userText);
        }
      } else {
        responseText = scaffoldResponse(userText);
      }

      const advisorMsg: Message = {
        id: String(Date.now() + 1),
        role: 'advisor',
        text: responseText,
        timestamp: Date.now() + 100,
      };
      setMessages((prev) => [...prev, advisorMsg]);
    } catch {
      const errMsg: Message = {
        id: String(Date.now() + 1),
        role: 'advisor',
        text: '[Error during inference. Model may need to be re-downloaded.]',
        timestamp: Date.now() + 100,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsGenerating(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const statusLabel: Record<ModelStatus, string> = {
    checking: 'FIELD INTELLIGENCE // CHECKING',
    not_downloaded: 'FIELD INTELLIGENCE // MODEL REQUIRED',
    downloading: 'FIELD INTELLIGENCE // DOWNLOADING',
    loading: 'FIELD INTELLIGENCE // LOADING',
    online: 'FIELD INTELLIGENCE // ONLINE',
    error: 'FIELD INTELLIGENCE // OFFLINE',
  };

  const statusColor: Record<ModelStatus, string> = {
    checking: Colors.textMuted,
    not_downloaded: Colors.warning,
    downloading: Colors.warning,
    loading: Colors.warning,
    online: Colors.secondary,
    error: Colors.danger,
  };

  if (modelStatus === 'checking') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Checking model status…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (modelStatus === 'not_downloaded') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.downloadContainer}>
          <Ionicons name="hardware-chip-outline" size={48} color={Colors.primary} />
          <Text style={styles.downloadTitle}>FIELD INTELLIGENCE</Text>
          <Text style={styles.downloadSubtitle}>ON-DEVICE AI MODEL</Text>
          <Text style={styles.downloadDesc}>
            The AI Advisor uses a local language model that runs entirely on your device. No internet
            required after download. Your conversations are never transmitted.
          </Text>
          <View style={styles.modelInfoCard}>
            <Text style={styles.modelLabel}>MODEL</Text>
            <Text style={styles.modelName}>{MODEL_NAME}</Text>
            <Text style={styles.modelSize}>Download size: ~2.2 GB · Wi-Fi recommended</Text>
          </View>
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.downloadBtnText}>Download Model</Text>
          </TouchableOpacity>
          <Text style={styles.downloadNote}>
            Once downloaded, the model works with zero internet connection.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (modelStatus === 'downloading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="cloud-download-outline" size={48} color={Colors.primary} />
          <Text style={styles.downloadTitle}>DOWNLOADING MODEL</Text>
          <Text style={styles.modelName}>{MODEL_NAME}</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${downloadProgress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(downloadProgress * 100)}%</Text>
          <Text style={styles.downloadNote}>Keep the app open. This may take several minutes on cellular.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (modelStatus === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Loading model into memory…</Text>
          <Text style={styles.loadingSubText}>This takes 10–30 seconds on first load.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (modelStatus === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={48} color={Colors.danger} />
          <Text style={styles.downloadTitle}>MODEL ERROR</Text>
          <Text style={styles.downloadDesc}>
            The model failed to initialize. Try re-downloading.
          </Text>
          <TouchableOpacity
            style={[styles.downloadBtn, { backgroundColor: Colors.danger }]}
            onPress={() => setModelStatus('not_downloaded')}
          >
            <Text style={styles.downloadBtnText}>Re-download Model</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // modelStatus === 'online'
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.advisorHeader}>
        <View style={[styles.statusDot, { backgroundColor: statusColor[modelStatus] }]} />
        <Text style={styles.advisorTitle}>FIELD INTELLIGENCE</Text>
        <View style={[styles.statusBadge, { borderColor: statusColor[modelStatus] }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor[modelStatus] }]}>
            {statusLabel[modelStatus].replace('FIELD INTELLIGENCE // ', '')}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.advisorBubble]}>
            {item.role === 'advisor' && (
              <Text style={styles.advisorLabel}>◈ FIELD INTELLIGENCE</Text>
            )}
            <Text
              style={[
                styles.bubbleText,
                item.role === 'user' ? styles.userBubbleText : styles.advisorBubbleText,
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
        ListFooterComponent={
          isGenerating ? (
            <View style={[styles.bubble, styles.advisorBubble]}>
              <Text style={styles.advisorLabel}>◈ FIELD INTELLIGENCE</Text>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={Colors.secondary} />
                <Text style={styles.typingText}>Analyzing…</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask the advisor..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isGenerating) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || isGenerating}
          >
            <Ionicons
              name="send"
              size={18}
              color={input.trim() && !isGenerating ? Colors.primary : Colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function scaffoldResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('water')) {
    return 'Water priority: locate source, filter sediment, boil 1 minute at sea level (3 minutes above 6500ft). Biological threats require purification — chemical contamination requires distillation. Hydration before food. 3 days without water is fatal; dehydration degrades judgment within hours.';
  }
  if (q.includes('wound') || q.includes('bleed') || q.includes('blood')) {
    return 'Hemorrhage control priority: apply direct pressure. If extremity, tourniquet 2-3 inches above wound, tighten until bleeding stops. Note time applied. Junctional hemorrhage (groin, armpit, neck) — use wound packing with gauze and direct pressure. Do not remove tourniquet once applied in field.';
  }
  if (q.includes('fire') || q.includes('heat') || q.includes('warmth')) {
    return 'Fire priority sequence: tinder (fine dry material) → kindling (pencil-thick sticks) → fuel (thumb-thick and larger). Fire triangle: heat, fuel, oxygen. In wet conditions, seek dry material under bark, dead leaves, or inside dead standing wood. Ferro rod works wet. Matches fail in wind — cup your body around the fire build.';
  }
  return `Analyzing: "${question}"\n\n[Field Intelligence scaffold mode — full AI inference active in production build. Model: ${MODEL_NAME}. System prompt loaded. This response will be replaced with live inference output from the on-device model when the full build is deployed.]`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  loadingText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 12 },
  loadingSubText: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },

  downloadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  downloadTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
  },
  downloadSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: -8,
  },
  downloadDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  modelInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 6,
    alignSelf: 'stretch',
  },
  modelLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  modelName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  modelSize: { color: Colors.textSecondary, fontSize: 12 },
  downloadBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  downloadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  downloadNote: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', maxWidth: 280 },
  progressBarContainer: {
    alignSelf: 'stretch',
    height: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  progressText: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },

  lockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryDim,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
  },
  lockTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  lockSub: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  featureList: { gap: 12, alignSelf: 'stretch', marginTop: 4 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16 },
  featureText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, flex: 1 },
  upgradeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  upgradeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  tierNote: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },

  advisorHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  advisorTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '900', letterSpacing: 2, flex: 1 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.surface,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  messageList: { padding: 16, gap: 12 },
  bubble: { borderRadius: 12, padding: 14, maxWidth: '90%', gap: 6 },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primaryDim,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  advisorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  advisorLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userBubbleText: { color: Colors.textPrimary },
  advisorBubbleText: { color: Colors.textSecondary },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { color: Colors.textMuted, fontSize: 13 },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
