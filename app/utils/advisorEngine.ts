/**
 * advisorEngine.ts — Field Intelligence on-device LLM runtime.
 *
 * Thin wrapper around llama.rn (llama.cpp for React Native). Owns the single
 * loaded LlamaContext so screens never hold native handles directly.
 *
 * - Runs 100% on-device. No network after the one-time model download.
 * - llama.rn is a native module: it is present in dev-client / store builds,
 *   absent in Expo Go. Every entry point degrades gracefully when absent.
 */
import { Platform } from 'react-native';
import type { LlamaContext } from 'llama.rn';

export type ChatRole = 'system' | 'user' | 'assistant';
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Model the app downloads on first use. MIT-licensed, safe for commercial distribution. */
export const ADVISOR_MODEL = {
  name: 'Phi-3.5 Mini Instruct (Q4_K_M)',
  file: 'phi-3.5-mini-instruct-q4_k_m.gguf',
  url: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf',
  sizeBytes: 2_393_232_672,
  sizeLabel: '2.4 GB',
  /** Minimum free space we require before starting the download (model + headroom). */
  minFreeBytes: 3_000_000_000,
  license: 'MIT (Microsoft Phi-3.5, quantized by bartowski)',
} as const;

const CONTEXT_TOKENS = 2048;
/** How many prior turns we replay into the prompt (keeps us inside CONTEXT_TOKENS). */
export const HISTORY_TURNS = 8;

const STOP_SEQUENCES = ['<|end|>', '<|user|>', '<|assistant|>', '<|endoftext|>', '</s>'];

let ctx: LlamaContext | null = null;
let loadedPath: string | null = null;
let runtimeChecked = false;
let runtimeAvailable = false;

type LlamaModule = typeof import('llama.rn');

async function loadRuntime(): Promise<LlamaModule | null> {
  try {
    const mod = (await import('llama.rn')) as LlamaModule;
    // Touching an export forces the native module to resolve; throws in Expo Go.
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

/**
 * Load a GGUF model from an absolute file path. Idempotent for the same path.
 * @param onProgress 0–100 while llama.cpp maps the weights.
 */
export async function loadModel(
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
      n_ctx: CONTEXT_TOKENS,
      n_batch: 256,
      // Metal is reliable on every supported iPhone; keep Android on CPU for broad compatibility.
      n_gpu_layers: Platform.OS === 'ios' ? 99 : 0,
      use_mlock: false,
    },
    onProgress,
  );
  loadedPath = modelPath;
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  /** Called with each new token as it is produced. */
  onToken?: (token: string) => void;
}

/** Run a chat completion against the loaded model. Resolves with the full reply. */
export async function generate(messages: ChatMessage[], opts: GenerateOptions = {}): Promise<string> {
  if (!ctx) throw new Error('Model not loaded.');
  const result = await ctx.completion(
    {
      messages,
      n_predict: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.7,
      top_p: 0.9,
      penalty_repeat: 1.1,
      stop: STOP_SEQUENCES,
    },
    opts.onToken ? (data) => opts.onToken?.(data.token) : undefined,
  );
  return result.text.trim();
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
  try {
    await current.release();
  } catch {
    /* context already gone */
  }
}
