/**
 * advisorEngine.ts — Field Intelligence on-device LLM runtime.
 *
 * Thin wrapper around llama.rn (llama.cpp for React Native). Owns the single
 * loaded LlamaContext so screens never hold native handles directly.
 *
 * - Runs 100% on-device. After the one-time model download no prompt, answer,
 *   or guide text ever leaves the phone.
 * - llama.rn is a native module: present in dev-client / store builds, absent in
 *   Expo Go. Every entry point degrades gracefully when absent.
 * - Two model sizes. The device's RAM picks the default; the user can override.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LlamaContext } from 'llama.rn';

export type ChatRole = 'system' | 'user' | 'assistant';
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type AdvisorModelId = 'standard' | 'lite';

export interface AdvisorModel {
  id: AdvisorModelId;
  name: string;
  tagline: string;
  file: string;
  url: string;
  sizeBytes: number;
  sizeLabel: string;
  /** Approximate peak RAM while loaded (weights + KV cache + runtime). */
  ramNeededBytes: number;
  ramLabel: string;
  /** Devices with at least this much total RAM get this model recommended. */
  minDeviceRamBytes: number;
  license: string;
  contextTokens: number;
  stop: string[];
}

const GB = 1_000_000_000;

/**
 * Both files verified on HuggingFace 2026-10-23 (exact byte sizes below).
 * Standard = best answers, needs a 6 GB+ phone. Lite = runs on ~all phones.
 */
export const ADVISOR_MODELS: Record<AdvisorModelId, AdvisorModel> = {
  standard: {
    id: 'standard',
    name: 'Phi-3.5 Mini Instruct',
    tagline: 'Best answers. Needs a phone with 6 GB RAM or more.',
    file: 'phi-3.5-mini-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf',
    sizeBytes: 2_393_232_672,
    sizeLabel: '2.4 GB',
    ramNeededBytes: 3.4 * GB,
    ramLabel: '~3.4 GB',
    minDeviceRamBytes: 5.5 * GB,
    license: 'MIT (Microsoft; GGUF by bartowski)',
    contextTokens: 2048,
    stop: ['<|end|>', '<|user|>', '<|assistant|>', '<|endoftext|>', '</s>'],
  },
  lite: {
    id: 'lite',
    name: 'Qwen2.5 1.5B Instruct',
    tagline: 'Fast and light. Works on most phones (4 GB RAM or more).',
    file: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    sizeBytes: 1_117_320_736,
    sizeLabel: '1.1 GB',
    ramNeededBytes: 1.6 * GB,
    ramLabel: '~1.6 GB',
    // Verified 2026-10-24: on a 3 GB Android device the runtime silently stalls
    // mid-answer (tokens never reach JS); the same build is fine with 4 GB.
    minDeviceRamBytes: 4 * GB,
    license: 'Apache-2.0 (Alibaba Qwen)',
    contextTokens: 2048,
    stop: ['<|im_end|>', '<|im_start|>', '<|endoftext|>'],
  },
};

/** Free-space headroom required on top of the model file before downloading. */
export const DOWNLOAD_HEADROOM_BYTES = 600_000_000;

const SELECTED_MODEL_KEY = 'griddown_advisor_model';

/** Rough chars-per-token for English prose with these tokenizers. */
const CHARS_PER_TOKEN = 3.6;
/** Tokens reserved for the model's reply. */
export const REPLY_TOKENS = 512;
/**
 * Generation watchdog. The timer restarts on every streamed token, so it only
 * fires when the runtime goes silent: no first token after prompt processing,
 * or a stall mid-answer. Prompt processing for a ~600-token grounded prompt is
 * 5–30 s on real phones; 90 s leaves generous headroom for slow devices.
 */
export const GENERATION_WATCHDOG_MS = 90_000;

/** Thrown by generate() when the watchdog fires. The model is unloaded first. */
export class GenerationTimeoutError extends Error {
  constructor() {
    super('The on-device model stopped responding.');
    this.name = 'GenerationTimeoutError';
  }
}

let ctx: LlamaContext | null = null;
let loadedPath: string | null = null;
let loadedModel: AdvisorModel | null = null;
let runtimeChecked = false;
let runtimeAvailable = false;

type LlamaModule = typeof import('llama.rn');

async function loadRuntime(): Promise<LlamaModule | null> {
  try {
    const mod = (await import('llama.rn')) as LlamaModule;
    if (typeof mod.initLlama !== 'function') return null;
    runtimeAvailable = true;
    return mod;
  } catch {
    runtimeAvailable = false;
    return null;
  } finally {
    runtimeChecked = true;
  }
}

/** True when the llama.rn native module is linked into this build. */
export async function isRuntimeAvailable(): Promise<boolean> {
  if (runtimeChecked) return runtimeAvailable;
  return (await loadRuntime()) !== null;
}

export function isModelLoaded(): boolean {
  return ctx !== null;
}

export function getLoadedModel(): AdvisorModel | null {
  return loadedModel;
}

// ─── Device fit ──────────────────────────────────────────────────────────────

export interface DeviceFit {
  totalRamBytes: number | null;
  recommended: AdvisorModelId;
  /** Models that should load on this device. */
  supported: AdvisorModelId[];
}

/** Read total device RAM via expo-device (null in environments without it). */
export async function getDeviceRamBytes(): Promise<number | null> {
  try {
    const Device = await import('expo-device');
    const total = Device.totalMemory;
    return typeof total === 'number' && total > 0 ? total : null;
  } catch {
    return null;
  }
}

/**
 * Pick the model this phone can run well. Unknown RAM → recommend Lite but
 * allow both (the user can still choose Standard).
 */
export async function getDeviceFit(): Promise<DeviceFit> {
  const totalRamBytes = await getDeviceRamBytes();
  if (totalRamBytes === null) {
    return { totalRamBytes, recommended: 'lite', supported: ['standard', 'lite'] };
  }
  const supported = (Object.values(ADVISOR_MODELS) as AdvisorModel[])
    .filter((m) => totalRamBytes >= m.minDeviceRamBytes)
    .map((m) => m.id);
  if (!supported.includes('lite')) supported.push('lite'); // always offer something
  return {
    totalRamBytes,
    recommended: supported.includes('standard') ? 'standard' : 'lite',
    supported,
  };
}

export async function getSelectedModelId(): Promise<AdvisorModelId | null> {
  try {
    const v = await AsyncStorage.getItem(SELECTED_MODEL_KEY);
    return v === 'standard' || v === 'lite' ? v : null;
  } catch {
    return null;
  }
}

export async function setSelectedModelId(id: AdvisorModelId): Promise<void> {
  try {
    await AsyncStorage.setItem(SELECTED_MODEL_KEY, id);
  } catch {
    /* non-fatal */
  }
}

// ─── Model lifecycle ─────────────────────────────────────────────────────────

/**
 * Load a GGUF model from an absolute file path. Idempotent for the same path.
 * @param onProgress 0–100 while llama.cpp maps the weights.
 */
export async function loadModel(
  model: AdvisorModel,
  modelPath: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (ctx && loadedPath === modelPath) return;
  const mod = await loadRuntime();
  if (!mod) throw new Error('AI runtime is not available in this build.');
  await releaseModel();
  ctx = await mod.initLlama(
    {
      model: modelPath,
      n_ctx: model.contextTokens,
      n_batch: 256,
      // Metal is reliable on every supported iPhone; keep Android on CPU for broad compatibility.
      n_gpu_layers: Platform.OS === 'ios' ? 99 : 0,
      use_mlock: false,
    },
    onProgress,
  );
  loadedPath = modelPath;
  loadedModel = model;
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  /** Called with each new token as it is produced. */
  onToken?: (token: string) => void;
  /** Override the watchdog (tests). */
  watchdogMs?: number;
}

/**
 * Run a chat completion against the loaded model. Resolves with the full reply.
 *
 * Rejects with GenerationTimeoutError if the runtime goes silent for
 * GENERATION_WATCHDOG_MS. Seen on a 3 GB device: llama.cpp finishes the work
 * but neither tokens nor the final result ever reach JS, which would leave the
 * UI spinning forever. On timeout the context is released so the next attempt
 * starts from a clean load.
 */
export async function generate(messages: ChatMessage[], opts: GenerateOptions = {}): Promise<string> {
  if (!ctx || !loadedModel) throw new Error('Model not loaded.');
  const model = loadedModel;
  const watchdogMs = opts.watchdogMs ?? GENERATION_WATCHDOG_MS;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;
  let rearm: () => void = () => {};
  const watchdog = new Promise<never>((_, reject) => {
    // Re-armed on every token so a long but healthy answer is never cut off.
    rearm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timedOut = true;
        reject(new GenerationTimeoutError());
      }, watchdogMs);
    };
    rearm();
  });

  const completion = ctx.completion(
    {
      messages,
      n_predict: opts.maxTokens ?? REPLY_TOKENS,
      temperature: opts.temperature ?? 0.6,
      top_p: 0.9,
      penalty_repeat: 1.1,
      stop: model.stop,
    },
    (data) => {
      if (timedOut) return;
      rearm();
      opts.onToken?.(data.token);
    },
  );

  try {
    const result = await Promise.race([completion, watchdog]);
    const text = stripEchoedReference(result.text);
    // Hit the length cap mid-sentence → cut back to the last full sentence so the
    // user never sees "Remember," hanging. (stopped_limit is non-zero on a length stop.)
    return result.stopped_limit ? trimToSentence(text) : text;
  } catch (err) {
    if (err instanceof GenerationTimeoutError) {
      // Best effort: interrupt whatever the runtime thinks it is doing, then
      // drop the context so the screen reloads the model on the next send.
      await stopGeneration();
      await releaseModel();
      // Swallow the orphaned completion if it ever settles.
      completion.catch(() => {});
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Keep everything up to the last sentence/line terminator, if that keeps most of the text. */
export function trimToSentence(text: string): string {
  const cut = Math.max(text.lastIndexOf('. '), text.lastIndexOf('.\n'), text.lastIndexOf('!'), text.lastIndexOf('?'), text.lastIndexOf('\n'));
  if (cut > text.length * 0.5) return text.slice(0, cut + 1).trimEnd();
  return text;
}

/** Interrupt an in-flight completion (safe to call when idle). */
export async function stopGeneration(): Promise<void> {
  try {
    await ctx?.stopCompletion();
  } catch {
    /* nothing in flight */
  }
}

/** Free native memory. Call when the Advisor screen unmounts. */
export async function releaseModel(): Promise<void> {
  if (!ctx) return;
  const current = ctx;
  ctx = null;
  loadedPath = null;
  loadedModel = null;
  try {
    await current.release();
  } catch {
    /* context already gone */
  }
}

// ─── Prompt assembly ─────────────────────────────────────────────────────────

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Assemble [system, ...history, user] so the whole prompt fits in the model's
 * context with REPLY_TOKENS left for the answer. Reference material (retrieved
 * guide excerpts) goes into the system message; history is trimmed oldest-first.
 */
export function buildPrompt(params: {
  systemPrompt: string;
  reference?: string;
  history: ChatMessage[];
  userText: string;
  contextTokens?: number;
}): ChatMessage[] {
  const contextTokens = params.contextTokens ?? loadedModel?.contextTokens ?? 2048;
  const budget = contextTokens - REPLY_TOKENS - 48; // template overhead
  // Small instruct models copy whatever sits in the system prompt, so the
  // reference material rides in the *user* turn, right before the question,
  // with an explicit instruction to paraphrase.
  const system = params.systemPrompt;
  const finalUser = params.reference
    ? `${params.reference}\n\nQuestion: ${params.userText}\n\nAnswer the question in your own words using the guides above. Do not copy their text or headings.`
    : params.userText;
  let used = estimateTokens(system) + estimateTokens(finalUser);
  const kept: ChatMessage[] = [];
  for (let i = params.history.length - 1; i >= 0; i--) {
    const m = params.history[i];
    const cost = estimateTokens(m.content) + 4;
    if (used + cost > budget) break;
    kept.unshift(m);
    used += cost;
  }
  // Never start history with an assistant turn (confuses chat templates).
  while (kept.length && kept[0].role === 'assistant') kept.shift();
  return [{ role: 'system', content: system }, ...kept, { role: 'user', content: finalUser }];
}

/** Drop lines where the model echoed the reference scaffolding instead of answering. */
export function stripEchoedReference(text: string): string {
  const lines = text.split('\n');
  const cleaned = lines.filter((l) => !/^\s*(\[\d+\]\s*)?(GUIDE|Guide):|^\s*REFERENCE\b|^\s*Situation:|^\s*Do immediately:|^\s*Question:/.test(l));
  const out = cleaned.join('\n').trim();
  return out.length > 20 ? out : text.trim();
}

/** Format retrieved guide excerpts as a reference block for the system prompt. */
export function formatReference(excerpts: string[]): string {
  if (excerpts.length === 0) return '';
  return (
    'Relevant GridDown guides (your source material):\n\n' +
    excerpts.map((e) => e.replace(/^GUIDE: /, 'Guide: ')).join('\n\n')
  );
}
