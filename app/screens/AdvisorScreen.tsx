import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import * as engine from '../utils/advisorEngine';
import { ADVISOR_MODELS, DOWNLOAD_HEADROOM_BYTES, type AdvisorModel, type AdvisorModelId, type DeviceFit } from '../utils/advisorEngine';
import { retrieveGuides } from '../utils/guideRetrieval';

interface Message {
  id: string;
  role: 'user' | 'advisor';
  text: string;
  timestamp: number;
  isMedical?: boolean;
  relatedGuideId?: string;
  /** Guides the answer was grounded in (retrieved from the on-device library). */
  sources?: Array<{ id: string; title: string }>;
}

const LOCKED_TIERS = ['free', 'monthly', 'yearly', 'lifetime_standard', 'discord'];

type ModelStatus =
  | 'checking'
  | 'not_downloaded'
  | 'downloading'
  | 'loading'
  | 'online'
  | 'error';

type AdvisorMode = 'instructor' | 'scenario' | 'gear' | 'planner';

const MODEL_KEYS = Object.keys(ADVISOR_MODELS) as AdvisorModelId[];

const SYSTEM_PROMPTS: Record<AdvisorMode, string> = {
  instructor:
    'You are Field Intelligence, the offline advisor inside the GridDown survival app, in Instructor mode. Explain survival skills, techniques, and concepts clearly and accurately. When the user supplies guide excerpts, use them as your source and mention the guide by name, but never repeat their text or headings — paraphrase. Otherwise rely on established survival principles, TCCC guidelines, and US Army field manual standards. Be direct and concrete. Reply with a short lead sentence and at most 6 numbered steps, each one or two lines; stop when the steps are done. If a medical question requires hands-on training beyond text guidance, say so.',
  scenario:
    'You are Field Intelligence in Scenario Coach mode. Present the user with a survival scenario and guide them through decision-making. Present choices, respond to their decisions with consequences, and debrief at the end with what worked and what didn\'t.',
  gear:
    'You are Field Intelligence in Gear Advisor mode. Help the user evaluate and improve their gear based on what they have. Be specific about gear recommendations. Do not recommend specific brands — focus on specifications and capabilities.',
  planner:
    'You are Field Intelligence in Preparedness Planner mode. Help the user build a prioritized preparedness plan based on their readiness gaps. Be specific, actionable, and realistic about timelines and costs.',
};

const MODE_GREETINGS: Record<AdvisorMode, string> = {
  instructor:
    'Instructor mode active. Ask about any survival skill, technique, or concept.',
  scenario:
    "Scenario Coach active. I'll present you with a survival scenario. Ready? Say 'start scenario' to begin, or describe a situation you want to train for.",
  gear:
    "Gear Advisor active. Tell me what gear you currently have, and I'll help you identify gaps and improvements.",
  planner:
    "Preparedness Planner active. Share your readiness goals or weaknesses, and I'll build you a prioritized action plan.",
};

const MODE_LABELS: Record<AdvisorMode, string> = {
  instructor: 'INSTRUCTOR',
  scenario: 'SCENARIO',
  gear: 'GEAR',
  planner: 'PLANNER',
};

const MEDICAL_SYSTEM_ADDENDUM =
  'MEDICAL SAFETY PROTOCOL: The user is asking about a medical topic. You MUST: ' +
  '1) Paraphrase ONLY from GridDown\'s educational guide content. ' +
  '2) NEVER say "you have", "you should take", "sounds like", "I diagnose", or "it appears you have". ' +
  '3) Always recommend calling emergency services. ' +
  '4) Append the mandatory disclaimer at end of response.';

const MEDICAL_FOOTER =
  '---\n' +
  '⚠ MEDICAL GUIDE REFERENCE ONLY\n' +
  'This information is from GridDown\'s educational guides only. Always call emergency services when available. — Field Intelligence';

const MEDICAL_KEYWORDS = [
  'blood', 'wound', 'bleeding', 'injury', 'hurt', 'pain',
  'tourniquet', 'airway', 'breathing', 'pulse', 'shock',
  'unconscious', 'unresponsive', 'seizure', 'stroke', 'heart',
  'cardiac', 'chest', 'fracture', 'burn', 'poisoning', 'overdose',
  'allergic', 'anaphylaxis', 'CPR', 'rescue', 'dying', 'dead',
  'triage', 'medic', 'hemorrhage', 'trauma', 'surgery', 'stitch',
  'suture', 'splint', 'infection', 'fever', 'diabetic', 'insulin',
];

const MEDICAL_KEYWORD_TO_GUIDE: Record<string, string> = {
  tourniquet: 'medical-002',
  bleeding:   'medical-002',
  wound:      'medical-003',
  airway:     'medical-001',
  breathing:  'medical-001',
  cpr:        'medical-006',
  shock:      'medical-004',
  triage:     'medical-001',
  burn:       'medical-005',
  fracture:   'medical-007',
};

function isMedicalQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return MEDICAL_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

function getRelatedGuide(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [kw, guideId] of Object.entries(MEDICAL_KEYWORD_TO_GUIDE)) {
    if (lower.includes(kw)) return guideId;
  }
  return null;
}

// Apple 2024 AI Disclosure (required for apps using AI-generated content)
const AI_DISCLOSURE =
  'Field Intelligence responses are generated by an AI model running on your device. ' +
  'Always verify critical survival information with qualified professionals when possible.';

const NETWORK_DISCLOSURE =
  'The model is downloaded once from HuggingFace (a public model host). After that, your questions, ' +
  'answers, and guide content never leave this phone.';

export function AdvisorScreen() {
  const { userTier } = useAppStore();
  const isLocked = LOCKED_TIERS.includes(userTier);

  if (isLocked) {
    return <LockedAdvisor />;
  }

  return <AdvisorInterface />;
}

function LockedAdvisor() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const navigation = require('@react-navigation/native').useNavigation();
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <View style={styles.lockedContainer}>
        <View style={styles.lockIconContainer}>
          <Ionicons name="lock-closed" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.lockBadge}>FIELD INTELLIGENCE</Text>
        <Text style={styles.lockTitle}>PRO + AI REQUIRED</Text>
        <Text style={styles.lockSub}>
          The AI Advisor runs fully on-device — no internet, no cloud, no logs. Your data never
          leaves your phone. It answers from the survival guides already in this app.
        </Text>
        <View style={styles.featureList}>
          {[
            'Ask scenario questions about your guides',
            'Reasons through your downloaded guides on-device',
            'Fully offline — no network required',
            'Your questions never leave your device',
            'Medical topics: guide-based responses only',
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
          accessibilityLabel="Upgrade to Pro + AI to unlock Field Intelligence"
          accessibilityRole="button"
        >
          <Text style={styles.upgradeBtnText}>Get Pro + AI</Text>
        </TouchableOpacity>
        <Text style={styles.tierNote}>
          Available with Pro + AI Monthly, Yearly, or Lifetime
        </Text>
      </View>
    </SafeAreaView>
  );
}

function ModeTabBar({
  mode,
  onModeChange,
}: {
  mode: AdvisorMode;
  onModeChange: (m: AdvisorMode) => void;
}) {
  const modes: AdvisorMode[] = ['instructor', 'scenario', 'gear', 'planner'];
  return (
    <View style={styles.modeTabBar}>
      {modes.map((m) => {
        const active = mode === m;
        return (
          <TouchableOpacity
            key={m}
            style={[styles.modeTab, active && styles.modeTabActive]}
            onPress={() => onModeChange(m)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${MODE_LABELS[m]} mode`}
          >
            <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>
              {MODE_LABELS[m]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * Minimal markdown → RN text. Small on-device models emit **bold**, `code` and
 * "### headings"; render bold properly and drop the rest of the syntax.
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  const cleaned = text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1');
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return cleaned;
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <Text key={i} style={styles.bubbleBold}>{part.slice(2, -2)}</Text>
    ) : (
      part
    ),
  );
}

function AdvisorInterface() {
  const navigation = useNavigation();
  const [modelStatus, setModelStatus] = useState<ModelStatus>('checking');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputIsMedical, setInputIsMedical] = useState(false);
  const [mode, setMode] = useState<AdvisorMode>('instructor');
  const listRef = useRef<FlatList<Message>>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [deviceFit, setDeviceFit] = useState<DeviceFit | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<AdvisorModelId>('lite');
  const [installedModelIds, setInstalledModelIds] = useState<AdvisorModelId[]>([]);
  const selectedModel: AdvisorModel = ADVISOR_MODELS[selectedModelId];

  const modelPathFor = (m: AdvisorModel, documentDirectory: string | null) =>
    `${documentDirectory ?? ''}${m.file}`;

  useEffect(() => {
    checkModelStatus();
    // Free native memory when the user leaves the Advisor.
    return () => {
      engine.stopGeneration();
      engine.releaseModel();
    };
  }, []);

  const checkModelStatus = async () => {
    try {
      const FileSystem = await import('expo-file-system/legacy');
      const fit = await engine.getDeviceFit();
      setDeviceFit(fit);

      // Which model files are already on disk?
      const installed: AdvisorModelId[] = [];
      for (const id of MODEL_KEYS) {
        const info = await FileSystem.getInfoAsync(modelPathFor(ADVISOR_MODELS[id], FileSystem.documentDirectory));
        if (info.exists) installed.push(id);
      }
      setInstalledModelIds(installed);

      // Saved choice → installed model → device recommendation.
      const saved = await engine.getSelectedModelId();
      const choice: AdvisorModelId =
        (saved && (installed.includes(saved) || installed.length === 0) ? saved : null)
        ?? installed[0]
        ?? fit.recommended;
      setSelectedModelId(choice);

      if (installed.includes(choice)) {
        setModelStatus('loading');
        await initModel(ADVISOR_MODELS[choice], modelPathFor(ADVISOR_MODELS[choice], FileSystem.documentDirectory));
      } else {
        setModelStatus('not_downloaded');
      }
    } catch {
      setModelStatus('not_downloaded');
    }
  };

  const chooseModel = async (id: AdvisorModelId) => {
    setSelectedModelId(id);
    await engine.setSelectedModelId(id);
  };

  /** Unload the current model and return to the picker (keeps downloaded files). */
  const changeModel = async () => {
    await engine.stopGeneration();
    await engine.releaseModel();
    setMessages([]);
    setModelStatus('not_downloaded');
  };

  const deleteModelFile = async (id: AdvisorModelId) => {
    try {
      const FileSystem = await import('expo-file-system/legacy');
      await FileSystem.deleteAsync(modelPathFor(ADVISOR_MODELS[id], FileSystem.documentDirectory), { idempotent: true });
      setInstalledModelIds((prev) => prev.filter((x) => x !== id));
    } catch { /* ignore */ }
  };

  const initModel = async (model: AdvisorModel, modelPath: string) => {
    try {
      setModelStatus('loading');
      setLoadProgress(0);
      const runtimeOk = await engine.isRuntimeAvailable();
      if (runtimeOk) {
        await engine.loadModel(model, modelPath, (pct) => setLoadProgress(pct));
        setModelStatus('online');
        setMessages([
          {
            id: '0',
            role: 'advisor',
            text: 'Field Intelligence online. Operating fully offline. Ask your question.',
            timestamp: Date.now(),
          },
        ]);
      } else if (__DEV__) {
        // Expo Go / web preview: native runtime is not linked. Demo mode only.
        setModelStatus('online');
        setMessages([
          {
            id: '0',
            role: 'advisor',
            text: 'Field Intelligence running in DEV demo mode (native AI runtime not linked in this build). Responses are canned. Use a dev-client or store build for the real model.',
            timestamp: Date.now(),
          },
        ]);
      } else {
        setErrorDetail('The on-device AI runtime is not available in this build. Please update GridDown from the store.');
        setModelStatus('error');
      }
    } catch (err) {
      setErrorDetail(err instanceof Error ? err.message : 'The model failed to initialize.');
      setModelStatus('error');
    }
  };

  const handleDownload = async () => {
    try {
      setErrorDetail(null);
      const FileSystem = await import('expo-file-system/legacy');
      const model = selectedModel;
      const modelPath = modelPathFor(model, FileSystem.documentDirectory);
      await engine.setSelectedModelId(model.id);

      // Guard: enough free storage for the model plus headroom.
      try {
        const free = await FileSystem.getFreeDiskStorageAsync();
        const minFree = model.sizeBytes + DOWNLOAD_HEADROOM_BYTES;
        if (free < minFree) {
          const needGb = (minFree / 1e9).toFixed(1);
          const haveGb = (free / 1e9).toFixed(1);
          setErrorDetail(`Not enough free storage. The model needs about ${needGb} GB free; this device has ${haveGb} GB.`);
          setModelStatus('error');
          return;
        }
      } catch {
        /* storage check unsupported on this platform — proceed */
      }

      setModelStatus('downloading');
      setDownloadProgress(0);
      const downloadResumable = FileSystem.createDownloadResumable(
        model.url,
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
      const result = await downloadResumable.downloadAsync();
      if (!result || (result.status && result.status >= 400)) {
        throw new Error(`Download failed (HTTP ${result?.status ?? 'unknown'}).`);
      }
      setInstalledModelIds((prev) => (prev.includes(model.id) ? prev : [...prev, model.id]));
      setModelStatus('loading');
      await initModel(model, modelPath);
    } catch (err) {
      // Remove any partial file so the next attempt starts clean.
      try {
        const FileSystem = await import('expo-file-system/legacy');
        await FileSystem.deleteAsync(modelPathFor(selectedModel, FileSystem.documentDirectory), { idempotent: true });
      } catch { /* nothing to clean */ }
      setErrorDetail(err instanceof Error ? err.message : 'Download failed. Check your connection and try again.');
      setModelStatus('error');
    }
  };

  const handleModeChange = (newMode: AdvisorMode) => {
    setMode(newMode);
    setInput('');
    setInputIsMedical(false);
    setMessages([
      {
        id: String(Date.now()),
        role: 'advisor',
        text: MODE_GREETINGS[newMode],
        timestamp: Date.now(),
      },
    ]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
  };

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;
    const userText = input.trim();
    setInput('');
    setInputIsMedical(false);

    const medical = mode === 'instructor' && isMedicalQuery(userText);
    const relatedGuideId = medical ? getRelatedGuide(userText) : null;

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    const modeSystemPrompt = SYSTEM_PROMPTS[mode];
    const effectiveSystemPrompt = medical
      ? `${modeSystemPrompt}\n\n${MEDICAL_SYSTEM_ADDENDUM}`
      : modeSystemPrompt;

    // Ground the answer in the app's own guides (on-device BM25 — no network).
    const retrieved = mode === 'scenario' ? [] : retrieveGuides(userText, { k: 3, excerptChars: 650 });
    const sources = retrieved.map((r) => ({ id: r.guide.id, title: r.guide.title }));
    const primaryGuideId = relatedGuideId ?? sources[0]?.id ?? null;

    const advisorId = String(Date.now() + 1);
    try {
      let responseText: string;
      if (engine.isModelLoaded()) {
        // The first message is the mode greeting, which we skip; buildPrompt trims
        // the oldest turns so everything fits the model's context window.
        const history = messages
          .filter((m, idx) => idx > 0 && !m.text.startsWith('['))
          .map<engine.ChatMessage>((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text.replace(MEDICAL_FOOTER, '').trim(),
          }));

        // Streaming: push an empty advisor bubble, then fill it token by token.
        setMessages((prev) => [
          ...prev,
          { id: advisorId, role: 'advisor', text: '', timestamp: Date.now() + 100, isMedical: medical, relatedGuideId: primaryGuideId ?? undefined, sources },
        ]);
        let streamed = '';
        responseText = await engine.generate(
          engine.buildPrompt({
            systemPrompt: effectiveSystemPrompt,
            reference: engine.formatReference(retrieved.map((r) => r.excerpt)),
            history,
            userText,
          }),
          {
            maxTokens: engine.REPLY_TOKENS,
            temperature: 0.6,
            onToken: (token) => {
              streamed += token;
              const snapshot = streamed;
              setMessages((prev) => prev.map((m) => (m.id === advisorId ? { ...m, text: snapshot } : m)));
            },
          },
        );
        if (!responseText) responseText = streamed.trim();
      } else {
        responseText = scaffoldResponse(userText);
        setMessages((prev) => [
          ...prev,
          { id: advisorId, role: 'advisor', text: '', timestamp: Date.now() + 100, isMedical: medical, relatedGuideId: primaryGuideId ?? undefined, sources },
        ]);
      }

      if (medical) {
        responseText = `${responseText}\n\n${MEDICAL_FOOTER}`;
      }

      const finalText = responseText;
      setMessages((prev) => prev.map((m) => (m.id === advisorId ? { ...m, text: finalText } : m)));
    } catch {
      const errText = '[Error during inference. Model may need to be re-downloaded.]';
      setMessages((prev) =>
        prev.some((m) => m.id === advisorId)
          ? prev.map((m) => (m.id === advisorId ? { ...m, text: errText } : m))
          : [...prev, { id: advisorId, role: 'advisor', text: errText, timestamp: Date.now() + 100 }],
      );
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
      <SafeAreaView edges={['left', 'right']} style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Checking model status…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (modelStatus === 'not_downloaded') {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.safe}>
        <View style={styles.downloadContainer}>
          <Ionicons name="hardware-chip-outline" size={48} color={Colors.primary} />
          <Text style={styles.downloadTitle}>FIELD INTELLIGENCE</Text>
          <Text style={styles.downloadSubtitle}>ON-DEVICE AI MODEL</Text>
          <Text style={styles.downloadDesc}>
            The AI Advisor uses a local language model that runs entirely on your device and answers
            from the guides in this app. {NETWORK_DISCLOSURE}
          </Text>
          {/* AI disclosure shown before model download */}
          <View style={styles.aiDisclosurePre}>
            <Text style={styles.aiDisclosurePreText}>{AI_DISCLOSURE}</Text>
          </View>
          <Text style={styles.modelLabel}>CHOOSE A MODEL</Text>
          {MODEL_KEYS.map((id) => {
            const m = ADVISOR_MODELS[id];
            const isSelected = id === selectedModelId;
            const isInstalled = installedModelIds.includes(id);
            const isRecommended = deviceFit?.recommended === id;
            const fits = !deviceFit || deviceFit.supported.includes(id);
            return (
              <TouchableOpacity
                key={id}
                style={[styles.modelInfoCard, isSelected && styles.modelInfoCardSelected, !fits && styles.modelInfoCardDim]}
                onPress={() => chooseModel(id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${m.name}, ${m.sizeLabel}${isRecommended ? ', recommended for this phone' : ''}`}
              >
                <View style={styles.modelCardHeader}>
                  <Text style={styles.modelName}>{m.name}</Text>
                  {isRecommended && <Text style={styles.modelBadge}>RECOMMENDED</Text>}
                  {isInstalled && <Text style={[styles.modelBadge, styles.modelBadgeInstalled]}>ON DEVICE</Text>}
                </View>
                <Text style={styles.modelSize}>{m.tagline}</Text>
                <Text style={styles.modelSize}>
                  {m.sizeLabel} download · {m.ramLabel} RAM while running · {m.license}
                </Text>
                {!fits && (
                  <Text style={styles.modelWarn}>
                    This phone reports {deviceFit?.totalRamBytes ? (deviceFit.totalRamBytes / 1e9).toFixed(0) : '?'} GB RAM — this model may fail to load.
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={installedModelIds.includes(selectedModelId) ? checkModelStatus : handleDownload}
            accessibilityLabel={installedModelIds.includes(selectedModelId)
              ? `Start ${selectedModel.name}`
              : `Download ${selectedModel.name} (${selectedModel.sizeLabel})`}
            accessibilityRole="button"
          >
            <Ionicons name={installedModelIds.includes(selectedModelId) ? 'play-outline' : 'download-outline'} size={20} color="#fff" />
            <Text style={styles.downloadBtnText}>
              {installedModelIds.includes(selectedModelId) ? `Start ${selectedModel.name}` : `Download ${selectedModel.sizeLabel} · Wi-Fi recommended`}
            </Text>
          </TouchableOpacity>
          {installedModelIds.filter((id) => id !== selectedModelId).map((id) => (
            <TouchableOpacity key={`del-${id}`} onPress={() => deleteModelFile(id)} accessibilityRole="button">
              <Text style={styles.downloadNote}>Remove {ADVISOR_MODELS[id].name} from this phone ({ADVISOR_MODELS[id].sizeLabel})</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.downloadNote}>
            Once downloaded, the model works with zero internet connection.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (modelStatus === 'downloading') {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="cloud-download-outline" size={48} color={Colors.primary} />
          <Text style={styles.downloadTitle}>DOWNLOADING MODEL</Text>
          <Text style={styles.modelName}>{selectedModel.name} · {selectedModel.sizeLabel}</Text>
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
      <SafeAreaView edges={['left', 'right']} style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Loading model into memory…</Text>
          {loadProgress > 0 && (
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, loadProgress)}%` }]} />
            </View>
          )}
          <Text style={styles.loadingSubText}>This takes 10–30 seconds on first load.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (modelStatus === 'error') {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={48} color={Colors.danger} />
          <Text style={styles.downloadTitle}>MODEL ERROR</Text>
          <Text style={styles.downloadDesc}>
            {errorDetail ?? 'The model failed to initialize. Try re-downloading.'}
          </Text>
          <TouchableOpacity
            style={[styles.downloadBtn, { backgroundColor: Colors.danger }]}
            onPress={() => { setErrorDetail(null); setModelStatus('not_downloaded'); }}
            accessibilityLabel="Re-download the AI model"
            accessibilityRole="button"
          >
            <Text style={styles.downloadBtnText}>Re-download Model</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // modelStatus === 'online'
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      {/* Header */}
      <View style={styles.advisorHeader}>
        <View style={[styles.statusDot, { backgroundColor: statusColor[modelStatus] }]} />
        <View style={styles.advisorHeaderText}>
          <Text style={styles.advisorTitle}>FIELD INTELLIGENCE</Text>
          <Text style={styles.advisorSubtitle}>
            Field Intelligence summarizes your downloaded guides
          </Text>
          <Text style={styles.advisorMeta}>On-device only. Your questions never leave your phone.</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusBadge, { borderColor: statusColor[modelStatus] }]}
          onPress={changeModel}
          accessibilityRole="button"
          accessibilityLabel="Change AI model"
        >
          <Text style={[styles.statusBadgeText, { color: statusColor[modelStatus] }]}>
            {engine.getLoadedModel()?.id === 'lite' ? 'LITE' : statusLabel[modelStatus].replace('FIELD INTELLIGENCE // ', '')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mode Tab Bar */}
      <ModeTabBar mode={mode} onModeChange={handleModeChange} />

      {/* AI Disclosure Banner — Apple 2024 AI content requirement */}
      <View style={styles.aiDisclosureBanner} accessibilityRole="text" accessibilityLabel="AI disclosure">
        <Ionicons name="information-circle-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.aiDisclosureText}>{AI_DISCLOSURE}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: Message }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user' ? styles.userBubble : styles.advisorBubble,
              item.isMedical && styles.medicalBubble,
            ]}
          >
            {item.role === 'advisor' && (
              // "AI-Assisted" label per Apple 2024 AI disclosure requirement
              <Text style={styles.advisorLabel}>◈ FIELD INTELLIGENCE · AI-ASSISTED</Text>
            )}
            {item.role === 'advisor' && item.text === '' && isGenerating ? (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={Colors.secondary} />
                <Text style={styles.typingText}>Reading your guides…</Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.bubbleText,
                  item.role === 'user' ? styles.userBubbleText : styles.advisorBubbleText,
                ]}
              >
                {item.role === 'advisor' ? renderInlineMarkdown(item.text) : item.text}
              </Text>
            )}
            {item.role === 'advisor' && item.sources && item.sources.length > 0 && item.text.length > 0 && (
              <View style={styles.sourcesRow}>
                <Text style={styles.sourcesLabel}>From your guides:</Text>
                {item.sources.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.sourceChip}
                    onPress={() =>
                      (navigation as any).navigate('Home', { screen: 'Guide', params: { guideId: s.id } })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Open guide ${s.title}`}
                  >
                    <Text style={styles.sourceChipText} numberOfLines={1}>{s.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {item.isMedical && (
              <View style={styles.medicalFooterRow}>
                <Text style={styles.medicalFlagText}>⚠ Medical reference</Text>
                {item.relatedGuideId ? (
                  <TouchableOpacity
                    style={styles.viewGuideBtn}
                    onPress={() =>
                      (navigation as any).navigate('Home', {
                        screen: 'Guide',
                        params: { guideId: item.relatedGuideId },
                      })
                    }
                    accessibilityLabel="View related guide"
                    accessibilityRole="button"
                  >
                    <Text style={styles.viewGuideBtnText}>📋 View Guide</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>
        )}
        ListFooterComponent={
          isGenerating && !(messages.length > 0 && messages[messages.length - 1].role === 'advisor' && messages[messages.length - 1].text === '') ? (
            <View style={[styles.bubble, styles.advisorBubble]}>
              <Text style={styles.advisorLabel}>◈ FIELD INTELLIGENCE · AI-ASSISTED</Text>
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
        {inputIsMedical && (
          <View style={styles.medicalInputWarning}>
            <Ionicons name="warning-outline" size={13} color="#8B9E67" />
            <Text style={styles.medicalInputWarningText}>
              Medical topics: guide-based responses only.
            </Text>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={(text) => {
              setInput(text);
              setInputIsMedical(mode === 'instructor' && isMedicalQuery(text));
            }}
            placeholder="Ask scenario questions..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            accessibilityLabel="Type a scenario question for the AI advisor"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isGenerating) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || isGenerating}
            accessibilityLabel="Send message"
            accessibilityRole="button"
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
  return `Analyzing: "${question}"\n\n[DEV demo mode — the on-device model is not linked in this build. In a dev-client or store build this is replaced by live inference.]`;
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
  aiDisclosurePre: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    alignSelf: 'stretch',
  },
  aiDisclosurePreText: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    fontStyle: 'italic',
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
  modelInfoCardSelected: { borderColor: Colors.secondary, borderWidth: 2 },
  modelInfoCardDim: { opacity: 0.7 },
  modelCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  modelBadge: {
    color: Colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1,
    borderWidth: 1, borderColor: Colors.secondary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
  },
  modelBadgeInstalled: { color: Colors.textSecondary, borderColor: Colors.textSecondary },
  modelWarn: { color: Colors.warning, fontSize: 12, marginTop: 4 },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 },
  sourcesLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  sourceChip: {
    borderWidth: 1, borderColor: Colors.secondary, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3, maxWidth: 220, minHeight: 28, justifyContent: 'center',
  },
  sourceChipText: { color: Colors.secondary, fontSize: 11, fontWeight: '600' },
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
  advisorHeaderText: { flex: 1, gap: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  advisorTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  advisorSubtitle: { color: Colors.textSecondary, fontSize: 11, lineHeight: 15 },
  advisorMeta: { color: Colors.textMuted, fontSize: 10, fontStyle: 'italic' },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.surface,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // Mode Tab Bar
  modeTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: Colors.primaryDim,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  modeTabText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modeTabTextActive: {
    color: Colors.primary,
  },

  // AI Disclosure Banner (Apple 2024 AI content requirement)
  aiDisclosureBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  aiDisclosureText: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
    fontStyle: 'italic',
  },
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
  advisorLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  bubbleBold: { fontWeight: '700', color: Colors.textPrimary },
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

  // Medical styling
  medicalBubble: {
    borderLeftWidth: 3,
    borderLeftColor: '#8B9E67',
  },
  medicalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  medicalFlagText: {
    color: '#8B9E67',
    fontSize: 11,
    fontWeight: '700',
  },
  viewGuideBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8B9E67',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  viewGuideBtnText: {
    color: '#8B9E67',
    fontSize: 11,
    fontWeight: '700',
  },
  medicalInputWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(139, 158, 103, 0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 158, 103, 0.2)',
  },
  medicalInputWarningText: {
    color: '#8B9E67',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
});
